import { BladeColor, FruitType, GameMode, GameSettings, GameStats, Point2D } from './types';
import { Fruit, FruitHalf } from './Fruit';
import { BladeTrail } from './BladeTrail';
import { ParticleSystem } from './ParticleSystem';
import { SoundEngine } from './SoundEngine';
import { HandTracker } from './HandTracker';

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: GameStats) => void;
  onGameOver: (finalStats: GameStats) => void;
  onTrackerStatus: (status: 'loading' | 'ready' | 'error' | 'no-camera', message?: string) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private video: HTMLVideoElement;
  private callbacks: GameEngineCallbacks;

  // Subsystems
  public sound: SoundEngine;
  public particles: ParticleSystem;
  public tracker: HandTracker;
  private bladeTrails: BladeTrail[] = [];

  // Game State
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private lastFrameTime: number = 0;
  private animFrameId: number | null = null;

  // Gameplay
  private fruits: Fruit[] = [];
  private fruitHalves: FruitHalf[] = [];
  private stats: GameStats = {
    score: 0,
    strikes: 0,
    maxStrikes: 3,
    combo: 0,
    maxCombo: 0,
    fruitsSliced: 0,
    bombsHit: 0,
    timeLeft: 90,
    playersDetected: 0,
    duel: {
      p1Score: 0,
      p2Score: 0,
      p1Slices: 0,
      p2Slices: 0,
      p1Combo: 0,
      p2Combo: 0,
      winner: null,
    },
  };

  public settings: GameSettings = {
    bladeColor: 'crimson',
    sliceSensitivity: 1.1,
    soundEnabled: true,
    sfxVolume: 0.8,
    mirrorCamera: true,
    cameraFilter: 'normal',
    streamOverlayMode: false,
    twoHandsEnabled: true,
    showWebcamFeed: true,
    gameMode: 'classic',
  };

  // Wave Spawning
  private spawnTimer: number = 0;
  private spawnInterval: number = 2.0; // Seconds between fruit waves
  private gravity: number = 850; // px/s^2

  // Combo tracking
  private comboResetTimeout: number | null = null;
  private comboCountInWindow: number = 0;
  private p1ComboWindow: number = 0;
  private p2ComboWindow: number = 0;
  private p1ComboTimeout: number | null = null;
  private p2ComboTimeout: number | null = null;

  // Mouse / Touch fallback
  private isMouseDown: boolean = false;

  constructor(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    callbacks: GameEngineCallbacks
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context from canvas');
    this.ctx = context;
    this.video = video;
    this.callbacks = callbacks;

    this.sound = new SoundEngine();
    this.particles = new ParticleSystem();

    // 4 Blade Trails:
    // [0]: P1 Primary (Crimson), [1]: P1 Secondary (Gold)
    // [2]: P2 Primary (Cyan),    [3]: P2 Secondary (Neon Green)
    this.bladeTrails = [
      new BladeTrail(this.settings.bladeColor, 'p1'),
      new BladeTrail('gold', 'p1'),
      new BladeTrail('cyan', 'p2'),
      new BladeTrail('neonGreen', 'p2'),
    ];

    this.tracker = new HandTracker({
      onHandsDetected: (p1Points, p2Points, playersDetected) =>
        this.handleHandPoints(p1Points, p2Points, playersDetected),
      onStatusChange: (status, message) => this.callbacks.onTrackerStatus(status, message),
    });

    this.setupMouseTouchEvents();
  }

  public async initialize(): Promise<void> {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    try {
      await this.tracker.initialize();
      await this.tracker.startCamera(this.video);
    } catch {
      // Mouse/touch fallback active
    }
  }

  private resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private setupMouseTouchEvents() {
    const handleMove = (x: number, y: number) => {
      if (this.settings.gameMode === 'duel') {
        if (x < this.canvas.width * 0.5) {
          this.bladeTrails[0].addPoint(x, y);
        } else {
          this.bladeTrails[2].addPoint(x, y);
        }
      } else {
        this.bladeTrails[0].addPoint(x, y);
      }
    };

    this.canvas.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      handleMove(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      handleMove(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    this.canvas.addEventListener('touchstart', (e) => {
      this.isMouseDown = true;
      if (e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      this.isMouseDown = false;
    });
  }

  public startGame(mode: GameMode = 'classic') {
    this.settings.gameMode = mode;
    this.stats = {
      score: 0,
      strikes: 0,
      maxStrikes: mode === 'classic' ? 3 : 999,
      combo: 0,
      maxCombo: 0,
      fruitsSliced: 0,
      bombsHit: 0,
      timeLeft: mode === 'zen' ? 90 : mode === 'duel' ? 60 : 0,
      playersDetected: 0,
      duel: {
        p1Score: 0,
        p2Score: 0,
        p1Slices: 0,
        p2Slices: 0,
        p1Combo: 0,
        p2Combo: 0,
        winner: null,
      },
    };

    this.fruits = [];
    this.fruitHalves = [];
    this.particles.clear();
    this.bladeTrails.forEach(t => t.clear());
    this.spawnTimer = 0;
    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTime = performance.now();

    this.sound.playStart();
    this.callbacks.onStatsUpdate({ ...this.stats });

    if (!this.animFrameId) {
      this.loop(performance.now());
    }
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (!paused) {
      this.lastFrameTime = performance.now();
    }
  }

  public updateSettings(newSettings: Partial<GameSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (newSettings.bladeColor) {
      this.bladeTrails[0].setColor(newSettings.bladeColor);
    }
    if (newSettings.soundEnabled !== undefined) {
      this.sound.setEnabled(newSettings.soundEnabled);
    }
    if (newSettings.sfxVolume !== undefined) {
      this.sound.setVolume(newSettings.sfxVolume);
    }
    if (newSettings.mirrorCamera !== undefined) {
      this.tracker.setMirror(newSettings.mirrorCamera);
    }
  }

  private handleHandPoints(p1Points: Point2D[], p2Points: Point2D[], playersDetected: number) {
    this.stats.playersDetected = playersDetected;
    if (!this.isRunning || this.isPaused) return;

    if (this.settings.gameMode === 'duel') {
      // Route Left-side hands to P1 blades
      if (p1Points.length > 0 && p1Points[0]) {
        this.bladeTrails[0].addPoint(p1Points[0].x, p1Points[0].y);
      }
      if (p1Points.length > 1 && p1Points[1]) {
        this.bladeTrails[1].addPoint(p1Points[1].x, p1Points[1].y);
      }

      // Route Right-side hands to P2 blades
      if (p2Points.length > 0 && p2Points[0]) {
        this.bladeTrails[2].addPoint(p2Points[0].x, p2Points[0].y);
      }
      if (p2Points.length > 1 && p2Points[1]) {
        this.bladeTrails[3].addPoint(p2Points[1].x, p2Points[1].y);
      }
    } else {
      // Single player: combine all hands
      const allPoints = [...p1Points, ...p2Points];
      if (allPoints.length > 0 && allPoints[0]) {
        this.bladeTrails[0].addPoint(allPoints[0].x, allPoints[0].y);
      }
      if (this.settings.twoHandsEnabled && allPoints.length > 1 && allPoints[1]) {
        this.bladeTrails[1].addPoint(allPoints[1].x, allPoints[1].y);
      }
    }
  }

  private loop = (currentTime: number) => {
    this.animFrameId = requestAnimationFrame(this.loop);

    const dt = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = currentTime;

    // Run hand tracking detection for this frame
    this.tracker.update(this.canvas.width, this.canvas.height);

    if (this.isRunning && !this.isPaused) {
      this.updateGame(dt);
    }

    this.render();
  };

  private updateGame(dt: number) {
    // Zen mode or Duel mode countdown
    if (this.settings.gameMode === 'zen' || this.settings.gameMode === 'duel') {
      this.stats.timeLeft -= dt;
      if (this.stats.timeLeft <= 0) {
        this.stats.timeLeft = 0;
        if (this.settings.gameMode === 'duel') {
          const p1 = this.stats.duel.p1Score;
          const p2 = this.stats.duel.p2Score;
          this.stats.duel.winner = p1 > p2 ? 'p1' : p2 > p1 ? 'p2' : 'tie';
          this.triggerGameOver(
            this.stats.duel.winner === 'tie'
              ? 'Draw! Both Ninjas Tied!'
              : `${this.stats.duel.winner === 'p1' ? 'Player 1 (Crimson)' : 'Player 2 (Azure)'} Victorious!`
          );
        } else {
          this.triggerGameOver('Time is up!');
        }
        return;
      }
    }

    // Update Blade Trails
    this.bladeTrails.forEach((trail) => {
      trail.update();
      const speed = trail.getSpeed();
      if (speed > 550) {
        this.sound.playSwoosh(speed);
      }
    });

    // Update Spawning
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnFruitWave();
      this.spawnTimer = 0;
      this.spawnInterval = Math.max(0.9, 2.2 - (this.stats.score / 60) * 0.9);
    }

    // Update Flying Fruits
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const fruit = this.fruits[i];
      fruit.update(dt, this.gravity);

      if (fruit.isOutOfBounds(this.canvas.height)) {
        if (!fruit.isSliced && fruit.type !== 'bomb') {
          fruit.isMissed = true;
          if (this.settings.gameMode === 'classic') {
            this.stats.strikes++;
            this.sound.playStrike();
            this.particles.addFloatingText(fruit.x, this.canvas.height - 40, 'MISS! ❌', '#ff3b30', 26);
            this.callbacks.onStatsUpdate({ ...this.stats });

            if (this.stats.strikes >= this.stats.maxStrikes) {
              this.triggerGameOver('3 Misses! Game Over');
              return;
            }
          }
        }
        this.fruits.splice(i, 1);
      }
    }

    // Update Sliced Halves
    for (let i = this.fruitHalves.length - 1; i >= 0; i--) {
      const half = this.fruitHalves[i];
      half.update(dt, this.gravity);
      if (half.isOutOfBounds(this.canvas.height)) {
        this.fruitHalves.splice(i, 1);
      }
    }

    // Check Blade Collisions
    this.checkCollisions();

    // Update Particles and Splatters
    this.particles.update(dt);
  }

  private spawnFruitWave() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const isDuel = this.settings.gameMode === 'duel';

    let count = 1;
    const r = Math.random();
    if (isDuel) {
      count = r < 0.3 ? 2 : r < 0.7 ? 3 : 4;
    } else if (this.stats.score > 30) {
      count = r < 0.3 ? 2 : r < 0.7 ? 3 : 4;
    } else if (this.stats.score > 10) {
      count = r < 0.5 ? 2 : 3;
    } else {
      count = r < 0.6 ? 1 : 2;
    }

    const availableFruits: FruitType[] = [
      'watermelon', 'apple', 'orange', 'banana', 'strawberry', 'pineapple'
    ];
    if (Math.random() < 0.2) {
      availableFruits.push('dragonfruit');
    }

    for (let i = 0; i < count; i++) {
      let type: FruitType;
      const isBomb =
        this.settings.gameMode !== 'zen' &&
        Math.random() < (isDuel ? 0.16 : this.settings.gameMode === 'classic' ? 0.22 : 0.14);

      if (isBomb) {
        type = 'bomb';
      } else {
        type = availableFruits[Math.floor(Math.random() * availableFruits.length)];
      }

      let x: number;
      let targetX: number;

      if (isDuel) {
        // In Duel: 45% spawn on Left (P1), 45% on Right (P2), 10% contested Center
        const sideRoll = Math.random();
        if (sideRoll < 0.45) {
          x = w * (0.1 + Math.random() * 0.35);
          targetX = w * (0.2 + Math.random() * 0.25);
        } else if (sideRoll < 0.90) {
          x = w * (0.55 + Math.random() * 0.35);
          targetX = w * (0.55 + Math.random() * 0.25);
        } else {
          // Contested center toss!
          x = w * 0.5 + (Math.random() - 0.5) * 60;
          targetX = w * 0.5;
        }
      } else {
        x = w * (0.15 + Math.random() * 0.7);
        targetX = w * (0.3 + Math.random() * 0.4);
      }

      const y = h + 50;
      const flightTime = 1.3 + Math.random() * 0.4;
      const vx = (targetX - x) / flightTime;
      const vy = -(730 + Math.random() * 220);

      this.fruits.push(new Fruit(x, y, vx, vy, type));
    }
  }

  private checkCollisions() {
    const minSpeed = 50;

    this.bladeTrails.forEach((trail) => {
      const segments = trail.getSlicingSegments(minSpeed);
      if (segments.length === 0) return;

      segments.forEach((seg) => {
        const cutAngle = Math.atan2(seg.p2.y - seg.p1.y, seg.p2.x - seg.p1.x);

        for (const fruit of this.fruits) {
          if (fruit.isSliced) continue;

          if (fruit.intersectsSegment(seg.p1, seg.p2, this.settings.sliceSensitivity)) {
            this.handleFruitSlice(fruit, cutAngle, seg.owner);
          }
        }
      });
    });
  }

  private handleFruitSlice(fruit: Fruit, cutAngle: number, owner: 'p1' | 'p2' | 'single') {
    const isDuel = this.settings.gameMode === 'duel';

    if (fruit.type === 'bomb') {
      fruit.isSliced = true;
      this.sound.playExplosion();
      this.particles.spawnBombExplosion(fruit.x, fruit.y);
      this.stats.bombsHit++;

      if (isDuel) {
        // Duel penalty: whichever player hit the bomb loses 10 points
        if (owner === 'p1') {
          this.stats.duel.p1Score = Math.max(0, this.stats.duel.p1Score - 10);
          this.particles.addFloatingText(fruit.x, fruit.y, 'P1 BOMB! -10 💥', '#ff3838', 32);
        } else {
          this.stats.duel.p2Score = Math.max(0, this.stats.duel.p2Score - 10);
          this.particles.addFloatingText(fruit.x, fruit.y, 'P2 BOMB! -10 💥', '#ff3838', 32);
        }
        this.callbacks.onStatsUpdate({ ...this.stats });
        return;
      } else if (this.settings.gameMode === 'classic') {
        this.triggerGameOver('BOOM! You sliced a bomb!');
        return;
      } else {
        this.stats.score = Math.max(0, this.stats.score - 10);
        this.particles.addFloatingText(fruit.x, fruit.y, 'BOMB! -10 💥', '#ff3838', 34);
        this.callbacks.onStatsUpdate({ ...this.stats });
        return;
      }
    }

    // Normal Fruit Sliced
    const [half1, half2] = fruit.slice(cutAngle);
    this.fruitHalves.push(half1, half2);

    this.sound.playSlice(fruit.type);
    this.particles.spawnJuiceFountain(fruit.x, fruit.y, fruit.type, cutAngle);

    const points = fruit.type === 'dragonfruit' ? 5 : fruit.type === 'pineapple' ? 3 : 1;
    this.stats.fruitsSliced++;

    if (isDuel) {
      if (owner === 'p1') {
        this.stats.duel.p1Score += points;
        this.stats.duel.p1Slices++;
        this.particles.addFloatingText(fruit.x, fruit.y, `P1 +${points}`, '#ff2d55', 28);
        this.trackDuelCombo('p1');
      } else {
        this.stats.duel.p2Score += points;
        this.stats.duel.p2Slices++;
        this.particles.addFloatingText(fruit.x, fruit.y, `P2 +${points}`, '#00f0ff', 28);
        this.trackDuelCombo('p2');
      }
    } else {
      this.stats.score += points;
      this.particles.addFloatingText(fruit.x, fruit.y, `+${points}`, '#ffd700', 26);

      this.comboCountInWindow++;
      if (this.comboResetTimeout) window.clearTimeout(this.comboResetTimeout);
      this.comboResetTimeout = window.setTimeout(() => {
        if (this.comboCountInWindow >= 3) {
          const bonus = this.comboCountInWindow;
          this.stats.score += bonus;
          this.stats.combo = this.comboCountInWindow;
          if (this.stats.combo > this.stats.maxCombo) {
            this.stats.maxCombo = this.stats.combo;
          }
          const comboText =
            this.comboCountInWindow >= 5
              ? `${this.comboCountInWindow}x BLITZ! +${bonus} ⚡`
              : `${this.comboCountInWindow}x COMBO! +${bonus} 🔥`;
          this.particles.addFloatingText(this.canvas.width / 2, this.canvas.height * 0.35, comboText, '#ff9500', 42);
          this.sound.playCombo(this.comboCountInWindow);
        }
        this.comboCountInWindow = 0;
        this.callbacks.onStatsUpdate({ ...this.stats });
      }, 280);
    }

    this.callbacks.onStatsUpdate({ ...this.stats });
  }

  private trackDuelCombo(player: 'p1' | 'p2') {
    if (player === 'p1') {
      this.p1ComboWindow++;
      if (this.p1ComboTimeout) window.clearTimeout(this.p1ComboTimeout);
      this.p1ComboTimeout = window.setTimeout(() => {
        if (this.p1ComboWindow >= 3) {
          const bonus = this.p1ComboWindow;
          this.stats.duel.p1Score += bonus;
          this.stats.duel.p1Combo = Math.max(this.stats.duel.p1Combo, this.p1ComboWindow);
          this.particles.addFloatingText(
            this.canvas.width * 0.25,
            this.canvas.height * 0.3,
            `P1 ${this.p1ComboWindow}x COMBO! +${bonus} 🔥`,
            '#ff2d55',
            34
          );
          this.sound.playCombo(this.p1ComboWindow);
        }
        this.p1ComboWindow = 0;
        this.callbacks.onStatsUpdate({ ...this.stats });
      }, 280);
    } else {
      this.p2ComboWindow++;
      if (this.p2ComboTimeout) window.clearTimeout(this.p2ComboTimeout);
      this.p2ComboTimeout = window.setTimeout(() => {
        if (this.p2ComboWindow >= 3) {
          const bonus = this.p2ComboWindow;
          this.stats.duel.p2Score += bonus;
          this.stats.duel.p2Combo = Math.max(this.stats.duel.p2Combo, this.p2ComboWindow);
          this.particles.addFloatingText(
            this.canvas.width * 0.75,
            this.canvas.height * 0.3,
            `P2 ${this.p2ComboWindow}x COMBO! +${bonus} ⚡`,
            '#00f0ff',
            34
          );
          this.sound.playCombo(this.p2ComboWindow);
        }
        this.p2ComboWindow = 0;
        this.callbacks.onStatsUpdate({ ...this.stats });
      }, 280);
    }
  }

  private triggerGameOver(reason: string) {
    this.isRunning = false;
    this.callbacks.onGameOver({ ...this.stats });
  }

  private render() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;
    const isDuel = this.settings.gameMode === 'duel';

    const shake = this.particles.getScreenShakeOffset();

    ctx.save();
    ctx.translate(shake.x, shake.y);

    // 1. Draw Webcam Video Background
    if (this.settings.showWebcamFeed && this.video.readyState >= 2) {
      ctx.save();

      if (this.settings.mirrorCamera) {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }

      if (this.settings.cameraFilter === 'vibrant') {
        ctx.filter = 'contrast(125%) saturate(140%) brightness(105%)';
      } else if (this.settings.cameraFilter === 'cyberpunk') {
        ctx.filter = 'hue-rotate(280deg) saturate(180%) contrast(120%)';
      } else if (this.settings.cameraFilter === 'comic') {
        ctx.filter = 'contrast(180%) saturate(150%) brightness(95%)';
      } else {
        ctx.filter = 'none';
      }

      const videoRatio = this.video.videoWidth / (this.video.videoHeight || 1);
      const canvasRatio = w / h;
      let drawW = w;
      let drawH = h;
      let offsetX = 0;
      let offsetY = 0;

      if (videoRatio > canvasRatio) {
        drawW = h * videoRatio;
        offsetX = -(drawW - w) / 2;
      } else {
        drawH = w / videoRatio;
        offsetY = -(drawH - h) / 2;
      }

      ctx.drawImage(this.video, offsetX, offsetY, drawW, drawH);
      ctx.restore();

      // Dojo dark vignette
      const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.4, w / 2, h / 2, w * 0.85);
      grad.addColorStop(0, 'rgba(10, 14, 25, 0.15)');
      grad.addColorStop(1, 'rgba(5, 7, 15, 0.7)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Duel Mode Center Arena Dividing Beam
    if (isDuel) {
      ctx.save();
      const midX = w / 2;

      // Subtle center divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(midX, 60);
      ctx.lineTo(midX, h - 40);
      ctx.stroke();

      // Center VS Emblem
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.arc(midX, h * 0.5, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffd700';
      ctx.font = '900 16px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VS', midX, h * 0.5);

      // Arena side tags
      ctx.font = '800 13px "Outfit", sans-serif';
      ctx.letterSpacing = '2px';

      ctx.fillStyle = 'rgba(255, 45, 85, 0.4)';
      ctx.fillText('◄ PLAYER 1 ZONE', midX * 0.5, h - 25);

      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.fillText('PLAYER 2 ZONE ►', midX + midX * 0.5, h - 25);

      ctx.restore();
    }

    // 3. Render Screen Splatters (Camera Lens Juice)
    this.particles.render(ctx);

    // 4. Render Flying Fruits & Sliced Halves
    this.fruitHalves.forEach(half => half.render(ctx));
    this.fruits.forEach(fruit => fruit.render(ctx));

    // 5. Render Blade Trails
    this.bladeTrails.forEach(trail => trail.render(ctx));

    ctx.restore();
  }

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.tracker.stop();
  }
}
