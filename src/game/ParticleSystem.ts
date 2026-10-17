import { FloatingText, FruitType } from './types';
import { FRUIT_CONFIGS } from './Fruit';

export interface JuiceParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

export interface ScreenSplatter {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  maxAlpha: number;
  dripSpeed: number;
  satellites: { dx: number; dy: number; r: number }[];
  lifetime: number;
  maxLifetime: number;
}

export class ParticleSystem {
  private particles: JuiceParticle[] = [];
  private splatters: ScreenSplatter[] = [];
  private floatingTexts: FloatingText[] = [];
  private screenShakeIntensity: number = 0;
  private screenShakeDecay: number = 0.9;

  public update(dt: number) {
    // 1. Update Juice Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 800 * dt; // Gravity
      p.vx *= 0.98; // Air resistance
      p.alpha -= p.decay * dt;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 2. Update Screen Splatters (Camera Lens Juice)
    for (let i = this.splatters.length - 1; i >= 0; i--) {
      const s = this.splatters[i];
      s.lifetime += dt;
      s.y += s.dripSpeed * dt; // Drip down the lens

      const progress = s.lifetime / s.maxLifetime;
      s.alpha = s.maxAlpha * Math.max(0, 1 - progress);

      if (s.lifetime >= s.maxLifetime) {
        this.splatters.splice(i, 1);
      }
    }

    // 3. Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.vy *= 0.94;
      ft.scale = Math.min(1.2, ft.scale + dt * 2);
      ft.alpha -= dt * 1.2;

      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 4. Update Screen Shake
    if (this.screenShakeIntensity > 0.1) {
      this.screenShakeIntensity *= this.screenShakeDecay;
    } else {
      this.screenShakeIntensity = 0;
    }
  }

  // Fruit slice juice explosion
  public spawnJuiceFountain(x: number, y: number, type: FruitType, cutAngle: number) {
    const config = FRUIT_CONFIGS[type];
    const count = type === 'dragonfruit' ? 45 : 28;
    const perpAngle = cutAngle + Math.PI / 2;

    for (let i = 0; i < count; i++) {
      // Spray mainly perpendicular to blade cut with spread
      const sprayAngle = (Math.random() > 0.5 ? perpAngle : perpAngle + Math.PI) + (Math.random() - 0.5) * 1.2;
      const speed = 150 + Math.random() * 450;

      this.particles.push({
        x,
        y,
        vx: Math.cos(sprayAngle) * speed,
        vy: Math.sin(sprayAngle) * speed - 100,
        radius: 2.5 + Math.random() * 4.5,
        color: config.juiceColor,
        alpha: 1,
        decay: 1.2 + Math.random() * 0.8,
      });
    }

    // Chance to stamp a juicy splatter on the camera lens
    if (Math.random() < 0.45 && type !== 'bomb') {
      this.spawnScreenSplatter(x, y, config.splashColor);
    }
  }

  // Stamp a dripping splatter on the camera lens
  public spawnScreenSplatter(x: number, y: number, color: string) {
    // Keep max 6 splatters so camera isn't completely obscured
    if (this.splatters.length >= 6) {
      this.splatters.shift();
    }

    const radius = 28 + Math.random() * 32;
    const satelliteCount = 4 + Math.floor(Math.random() * 5);
    const satellites = [];

    for (let i = 0; i < satelliteCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = radius * (0.8 + Math.random() * 0.9);
      satellites.push({
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        r: 3 + Math.random() * 7,
      });
    }

    this.splatters.push({
      x,
      y,
      radius,
      color,
      alpha: 0.65,
      maxAlpha: 0.65,
      dripSpeed: 4 + Math.random() * 8,
      satellites,
      lifetime: 0,
      maxLifetime: 3.5, // 3.5 seconds fade
    });
  }

  // Bomb detonation shockwave and fiery explosion
  public spawnBombExplosion(x: number, y: number) {
    this.screenShakeIntensity = 25; // Violent screen shake!

    const count = 70;
    const colors = ['#ff3838', '#ff9f1a', '#fffa65', '#ffffff', '#4d4d4d'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 600;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        radius: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 1.0 + Math.random() * 1.5,
      });
    }
  }

  // Floating score or combo text
  public addFloatingText(x: number, y: number, text: string, color: string = '#ffd700', size: number = 28) {
    this.floatingTexts.push({
      id: Math.random().toString(),
      x,
      y,
      text,
      color,
      size,
      alpha: 1,
      vy: -110,
      scale: 0.5,
    });
  }

  public getScreenShakeOffset(): { x: number; y: number } {
    if (this.screenShakeIntensity <= 0.1) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * this.screenShakeIntensity,
      y: (Math.random() - 0.5) * this.screenShakeIntensity,
    };
  }

  // Render particles, splatters, and floating texts
  public render(ctx: CanvasRenderingContext2D) {
    // 1. Render Screen Splatters (Camera lens decals)
    for (const s of this.splatters) {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = s.color;

      // Central irregular blob
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();

      // Satellite droplets around main splatter
      for (const sat of s.satellites) {
        ctx.beginPath();
        ctx.arc(s.x + sat.dx, s.y + sat.dy, sat.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Render Juice Droplet Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, p.radius), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Render Floating Combo / Score Texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.translate(ft.x, ft.y);
      ctx.scale(ft.scale, ft.scale);

      ctx.font = `900 ${ft.size}px 'Bangers', cursive, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Drop shadow / stroke
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.strokeText(ft.text, 0, 0);

      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);

      ctx.restore();
    }
  }

  public clear() {
    this.particles = [];
    this.splatters = [];
    this.floatingTexts = [];
    this.screenShakeIntensity = 0;
  }
}
