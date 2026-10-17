import { BladeColor, BladeTrailPoint, Point2D } from './types';

export class BladeTrail {
  private points: BladeTrailPoint[] = [];
  private maxAgeMs: number = 220; // Trail decay time
  private color: BladeColor = 'crimson';
  private currentSpeed: number = 0;
  public owner: 'p1' | 'p2' | 'single';

  constructor(color: BladeColor = 'crimson', owner: 'p1' | 'p2' | 'single' = 'single') {
    this.color = color;
    this.owner = owner;
  }

  public setColor(color: BladeColor) {
    this.color = color;
  }

  public addPoint(x: number, y: number) {
    const now = performance.now();
    let speed = 0;
    if (this.points.length > 0) {
      const last = this.points[this.points.length - 1];
      const dt = (now - last.time) / 1000;
      if (dt > 0.001) {
        const dx = x - last.x;
        const dy = y - last.y;
        speed = Math.sqrt(dx * dx + dy * dy) / dt;
      } else {
        speed = last.speed;
      }
    }
    this.currentSpeed = this.currentSpeed * 0.4 + speed * 0.6;
    this.points.push({ x, y, time: now, speed: this.currentSpeed });
  }

  public update() {
    const now = performance.now();
    while (this.points.length > 0 && now - this.points[0].time > this.maxAgeMs) {
      this.points.shift();
    }
    if (this.points.length === 0) {
      this.currentSpeed = 0;
    }
  }

  public clear() {
    this.points = [];
    this.currentSpeed = 0;
  }

  public getPoints(): BladeTrailPoint[] {
    return this.points;
  }

  public getLatestPoint(): BladeTrailPoint | null {
    return this.points.length > 0 ? this.points[this.points.length - 1] : null;
  }

  public getSpeed(): number {
    return this.currentSpeed;
  }

  public getSlicingSegments(minSpeed: number = 300): { p1: Point2D; p2: Point2D; speed: number; owner: 'p1' | 'p2' | 'single' }[] {
    const segments: { p1: Point2D; p2: Point2D; speed: number; owner: 'p1' | 'p2' | 'single' }[] = [];
    if (this.points.length < 2) return segments;

    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      const segSpeed = Math.max(p1.speed, p2.speed);
      if (segSpeed >= minSpeed) {
        segments.push({
          p1: { x: p1.x, y: p1.y },
          p2: { x: p2.x, y: p2.y },
          speed: segSpeed,
          owner: this.owner,
        });
      }
    }
    return segments;
  }

  private getColorPalette(time: number): { core: string; glow: string; shadow: string } {
    switch (this.color) {
      case 'cyan':
        return { core: '#ffffff', glow: '#00f0ff', shadow: '#00a8ff' };
      case 'gold':
        return { core: '#fffbe6', glow: '#ffd700', shadow: '#ff8c00' };
      case 'neonGreen':
        return { core: '#f0fff4', glow: '#39ff14', shadow: '#00cc44' };
      case 'cyberViolet':
        return { core: '#ffffff', glow: '#ff007f', shadow: '#9d00ff' };
      case 'rainbow': {
        const hue = (time * 0.2) % 360;
        return { core: '#ffffff', glow: `hsl(${hue}, 100%, 65%)`, shadow: `hsl(${hue}, 100%, 50%)` };
      }
      case 'crimson':
      default:
        return { core: '#ffffff', glow: '#ff2d55', shadow: '#ff003c' };
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;

    const now = performance.now();
    const palette = this.getColorPalette(now);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Pass 1: Outer Neon Glow
    ctx.shadowBlur = 24;
    ctx.shadowColor = palette.shadow;

    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      const ageProgress = (now - p2.time) / this.maxAgeMs;
      const alpha = Math.max(0, 1 - ageProgress);
      const width = Math.max(2, (1 - ageProgress) * 14 + (p2.speed / 1200) * 8);

      ctx.beginPath();
      ctx.strokeStyle = palette.glow;
      ctx.globalAlpha = alpha * 0.85;
      ctx.lineWidth = width;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Pass 2: Inner Core
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ffffff';

    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      const ageProgress = (now - p2.time) / this.maxAgeMs;
      const alpha = Math.max(0, 1 - ageProgress);
      const width = Math.max(1, (1 - ageProgress) * 5);

      ctx.beginPath();
      ctx.strokeStyle = palette.core;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Pass 3: Tip Glow Star
    const tip = this.points[this.points.length - 1];
    if (tip) {
      ctx.shadowBlur = 30;
      ctx.shadowColor = palette.glow;
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
