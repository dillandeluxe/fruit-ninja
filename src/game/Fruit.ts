import { FruitConfig, FruitType, Point2D } from './types';

export const FRUIT_CONFIGS: Record<FruitType, FruitConfig> = {
  watermelon: {
    type: 'watermelon',
    name: 'Watermelon',
    radius: 46,
    points: 2,
    juiceColor: '#ff2d55',
    splashColor: 'rgba(255, 45, 85, 0.4)',
    innerColor: '#ff2d55',
    outerColor: '#2e7d32',
  },
  apple: {
    type: 'apple',
    name: 'Apple',
    radius: 38,
    points: 1,
    juiceColor: '#ff3b30',
    splashColor: 'rgba(255, 59, 48, 0.4)',
    innerColor: '#fff9c4',
    outerColor: '#d32f2f',
  },
  orange: {
    type: 'orange',
    name: 'Orange',
    radius: 38,
    points: 1,
    juiceColor: '#ff9500',
    splashColor: 'rgba(255, 149, 0, 0.4)',
    innerColor: '#ffb74d',
    outerColor: '#f57c00',
  },
  banana: {
    type: 'banana',
    name: 'Banana',
    radius: 36,
    points: 1,
    juiceColor: '#ffcc00',
    splashColor: 'rgba(255, 204, 0, 0.4)',
    innerColor: '#fffde7',
    outerColor: '#fbc02d',
  },
  strawberry: {
    type: 'strawberry',
    name: 'Strawberry',
    radius: 32,
    points: 2,
    juiceColor: '#e91e63',
    splashColor: 'rgba(233, 30, 99, 0.4)',
    innerColor: '#f48fb1',
    outerColor: '#c2185b',
  },
  pineapple: {
    type: 'pineapple',
    name: 'Pineapple',
    radius: 48,
    points: 3,
    juiceColor: '#ffeb3b',
    splashColor: 'rgba(255, 235, 59, 0.4)',
    innerColor: '#fff176',
    outerColor: '#e65100',
  },
  dragonfruit: {
    type: 'dragonfruit',
    name: 'Dragonfruit',
    radius: 44,
    points: 5,
    juiceColor: '#d81b60',
    splashColor: 'rgba(216, 27, 96, 0.45)',
    innerColor: '#ffffff',
    outerColor: '#c2185b',
  },
  bomb: {
    type: 'bomb',
    name: 'Bomb',
    radius: 40,
    points: 0,
    juiceColor: '#ff3b30',
    splashColor: 'rgba(255, 69, 0, 0.6)',
    innerColor: '#212121',
    outerColor: '#111111',
  },
};

export class FruitHalf {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public rotation: number;
  public vRot: number;
  public radius: number;
  public type: FruitType;
  public cutAngle: number;
  public side: 'left' | 'right';
  public alpha: number = 1;

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    rotation: number,
    vRot: number,
    radius: number,
    type: FruitType,
    cutAngle: number,
    side: 'left' | 'right'
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.rotation = rotation;
    this.vRot = vRot;
    this.radius = radius;
    this.type = type;
    this.cutAngle = cutAngle;
    this.side = side;
  }

  public update(dt: number, gravity: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += gravity * dt;
    this.rotation += this.vRot * dt;
  }

  public isOutOfBounds(height: number): boolean {
    return this.y > height + 100;
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Clip to semicircle on the specified side
    ctx.beginPath();
    if (this.side === 'left') {
      ctx.arc(0, 0, this.radius, -Math.PI / 2, Math.PI / 2, true);
    } else {
      ctx.arc(0, 0, this.radius, -Math.PI / 2, Math.PI / 2, false);
    }
    ctx.closePath();
    ctx.clip();

    // Render outer rind / skin
    drawFruitSkin(ctx, this.type, this.radius);

    ctx.restore();

    // Render exposed flat sliced face
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    drawFruitCrossSection(ctx, this.type, this.radius, this.side);

    ctx.restore();
  }
}

export class Fruit {
  public id: string;
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public rotation: number = 0;
  public vRot: number;
  public radius: number;
  public type: FruitType;
  public isSliced: boolean = false;
  public isMissed: boolean = false;
  public fuseTime: number = 0;

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    type: FruitType
  ) {
    this.id = Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type;
    this.radius = FRUIT_CONFIGS[type].radius;
    this.vRot = (Math.random() - 0.5) * 4; // Angular velocity
  }

  public update(dt: number, gravity: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += gravity * dt;
    this.rotation += this.vRot * dt;
    this.fuseTime += dt;
  }

  public isOutOfBounds(height: number): boolean {
    return this.y > height + 80 && this.vy > 0;
  }

  // Check collision with line segment (p1 to p2)
  public intersectsSegment(p1: Point2D, p2: Point2D, sensitivity: number = 1.0): boolean {
    if (this.isSliced) return false;

    const hitRadius = this.radius * sensitivity;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) {
      const distSq = (this.x - p1.x) ** 2 + (this.y - p1.y) ** 2;
      return distSq <= hitRadius * hitRadius;
    }

    // Projection scalar t on line segment [0, 1]
    const t = Math.max(0, Math.min(1, ((this.x - p1.x) * dx + (this.y - p1.y) * dy) / lenSq));
    const closestX = p1.x + t * dx;
    const closestY = p1.y + t * dy;

    const distSq = (this.x - closestX) ** 2 + (this.y - closestY) ** 2;
    return distSq <= hitRadius * hitRadius;
  }

  public slice(cutAngle: number): [FruitHalf, FruitHalf] {
    this.isSliced = true;
    const separationSpeed = 220;
    const perpAngle = cutAngle + Math.PI / 2;

    const h1Vx = this.vx - Math.cos(perpAngle) * separationSpeed;
    const h1Vy = this.vy - Math.sin(perpAngle) * separationSpeed - 60;
    const h2Vx = this.vx + Math.cos(perpAngle) * separationSpeed;
    const h2Vy = this.vy + Math.sin(perpAngle) * separationSpeed - 60;

    const half1 = new FruitHalf(
      this.x,
      this.y,
      h1Vx,
      h1Vy,
      cutAngle,
      -3.5,
      this.radius,
      this.type,
      cutAngle,
      'left'
    );

    const half2 = new FruitHalf(
      this.x,
      this.y,
      h2Vx,
      h2Vy,
      cutAngle,
      3.5,
      this.radius,
      this.type,
      cutAngle,
      'right'
    );

    return [half1, half2];
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (this.isSliced) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    drawWholeFruit(ctx, this.type, this.radius, this.fuseTime);

    ctx.restore();
  }
}

// Vector rendering routines for crisp graphic juice
function drawWholeFruit(ctx: CanvasRenderingContext2D, type: FruitType, r: number, fuseTime: number) {
  switch (type) {
    case 'watermelon': {
      // Green striped rind
      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      grad.addColorStop(0, '#4caf50');
      grad.addColorStop(0.7, '#2e7d32');
      grad.addColorStop(1, '#1b5e20');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Dark green wavy stripes
      ctx.strokeStyle = '#144216';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        ctx.beginPath();
        const startX = Math.cos(angle) * (r * 0.2);
        const startY = Math.sin(angle) * (r * 0.2);
        const endX = Math.cos(angle) * (r * 0.95);
        const endY = Math.sin(angle) * (r * 0.95);
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(
          (startX + endX) / 2 + Math.sin(angle) * 8,
          (startY + endY) / 2 - Math.cos(angle) * 8,
          endX,
          endY
        );
        ctx.stroke();
      }

      // Specular highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.25, r * 0.15, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'apple': {
      // Shiny red apple
      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      grad.addColorStop(0, '#ff5252');
      grad.addColorStop(0.8, '#d32f2f');
      grad.addColorStop(1, '#8b0000');

      ctx.fillStyle = grad;
      ctx.beginPath();
      // Apple heart shape
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Stem
      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, -r + 2);
      ctx.quadraticCurveTo(5, -r - 12, 8, -r - 14);
      ctx.stroke();

      // Leaf
      ctx.fillStyle = '#4caf50';
      ctx.beginPath();
      ctx.ellipse(6, -r - 8, 7, 4, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.3, -r * 0.35, r * 0.2, r * 0.1, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'orange': {
      // Textured orange
      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      grad.addColorStop(0, '#ffb74d');
      grad.addColorStop(0.8, '#f57c00');
      grad.addColorStop(1, '#e65100');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Tiny peel pores
      ctx.fillStyle = 'rgba(230, 81, 0, 0.3)';
      for (let i = 0; i < 12; i++) {
        const angle = i * 0.52;
        const dist = (i % 3 + 1) * (r * 0.25);
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.3, -r * 0.3, r * 0.2, r * 0.12, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'banana': {
      // Curved banana
      ctx.save();
      ctx.rotate(0.2);
      const grad = ctx.createLinearGradient(-r, -r, r, r);
      grad.addColorStop(0, '#fff59d');
      grad.addColorStop(0.5, '#fbc02d');
      grad.addColorStop(1, '#f57f17');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.25, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tips
      ctx.fillStyle = '#6d4c41';
      ctx.beginPath();
      ctx.arc(r * 1.15, 0, 4, 0, Math.PI * 2);
      ctx.arc(-r * 1.15, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'strawberry': {
      // Strawberry heart shape
      const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 5, 0, 0, r);
      grad.addColorStop(0, '#ff4081');
      grad.addColorStop(0.7, '#e91e63');
      grad.addColorStop(1, '#c2185b');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, r);
      ctx.bezierCurveTo(-r * 1.2, r * 0.2, -r * 1.1, -r * 0.7, 0, -r * 0.8);
      ctx.bezierCurveTo(r * 1.1, -r * 0.7, r * 1.2, r * 0.2, 0, r);
      ctx.fill();

      // Yellow seeds
      ctx.fillStyle = '#fff59d';
      const seedPoints = [
        { x: 0, y: 0 }, { x: -r * 0.4, y: -r * 0.2 }, { x: r * 0.4, y: -r * 0.2 },
        { x: -r * 0.3, y: r * 0.3 }, { x: r * 0.3, y: r * 0.3 }, { x: 0, y: r * 0.5 }
      ];
      seedPoints.forEach(p => {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 1.5, 2.5, 0.1, 0, Math.PI * 2);
        ctx.fill();
      });

      // Green crown leaves
      ctx.fillStyle = '#4caf50';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.8, r * 0.4, r * 0.15, 0, 0, Math.PI * 2);
      ctx.ellipse(-r * 0.3, -r * 0.8, r * 0.3, r * 0.12, -0.4, 0, Math.PI * 2);
      ctx.ellipse(r * 0.3, -r * 0.8, r * 0.3, r * 0.12, 0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'pineapple': {
      // Golden pineapple body
      const grad = ctx.createLinearGradient(0, -r, 0, r);
      grad.addColorStop(0, '#ffb300');
      grad.addColorStop(0.5, '#ffa000');
      grad.addColorStop(1, '#e65100');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.15, r * 0.75, r * 0.95, 0, 0, Math.PI * 2);
      ctx.fill();

      // Diamond pattern
      ctx.strokeStyle = '#bf360c';
      ctx.lineWidth = 1.5;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.6, i * 14);
        ctx.lineTo(r * 0.6, i * 14 + 18);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(r * 0.6, i * 14);
        ctx.lineTo(-r * 0.6, i * 14 + 18);
        ctx.stroke();
      }

      // Spiky crown
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.7);
      ctx.lineTo(-r * 0.3, -r * 1.3);
      ctx.lineTo(-r * 0.1, -r * 0.85);
      ctx.lineTo(0, -r * 1.45);
      ctx.lineTo(r * 0.1, -r * 0.85);
      ctx.lineTo(r * 0.3, -r * 1.3);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'dragonfruit': {
      // Magenta mythical dragonfruit with fiery scales
      const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 5, 0, 0, r);
      grad.addColorStop(0, '#ff4081');
      grad.addColorStop(0.7, '#d81b60');
      grad.addColorStop(1, '#880e4f');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Green scales
      ctx.fillStyle = '#76ff03';
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        ctx.beginPath();
        const sx = Math.cos(ang) * (r * 0.7);
        const sy = Math.sin(ang) * (r * 0.7);
        ctx.ellipse(sx, sy, 8, 4, ang + 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'bomb': {
      // Cast-iron metallic bomb sphere
      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      grad.addColorStop(0, '#555555');
      grad.addColorStop(0.6, '#222222');
      grad.addColorStop(1, '#0a0a0a');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Golden fuse cap
      ctx.fillStyle = '#c5a059';
      ctx.beginPath();
      ctx.rect(-6, -r - 4, 12, 6);
      ctx.fill();

      // Curved rope fuse
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -r - 4);
      ctx.quadraticCurveTo(10, -r - 18, 16, -r - 20);
      ctx.stroke();

      // Sizzling spark at tip of fuse
      const sparkX = 16;
      const sparkY = -r - 20;
      const sparkPulse = (Math.sin(fuseTime * 20) + 1) * 3 + 4;

      ctx.fillStyle = '#fffa65';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ff3838';
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, sparkPulse, 0, Math.PI * 2);
      ctx.fill();

      // Crossed bones / skull badge
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff3b30';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💣', 0, 4);
      break;
    }
  }
}

function drawFruitSkin(ctx: CanvasRenderingContext2D, type: FruitType, r: number) {
  drawWholeFruit(ctx, type, r, 0);
}

function drawFruitCrossSection(ctx: CanvasRenderingContext2D, type: FruitType, r: number, side: 'left' | 'right') {
  // Draw the cut surface showing the interior flesh
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(0, r);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.stroke();

  // Draw interior pulp details
  switch (type) {
    case 'watermelon': {
      // Red pulp inside with black seeds
      ctx.fillStyle = '#ff2d55';
      ctx.beginPath();
      if (side === 'left') {
        ctx.arc(0, 0, r * 0.88, -Math.PI / 2, Math.PI / 2, true);
      } else {
        ctx.arc(0, 0, r * 0.88, -Math.PI / 2, Math.PI / 2, false);
      }
      ctx.fill();

      // Watermelon seeds
      ctx.fillStyle = '#1a1a1a';
      const dir = side === 'left' ? -1 : 1;
      const seeds = [
        { x: dir * (r * 0.4), y: -r * 0.3 },
        { x: dir * (r * 0.55), y: 0 },
        { x: dir * (r * 0.4), y: r * 0.3 },
      ];
      seeds.forEach(s => {
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, 2, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case 'orange': {
      // Citrus wheel segments
      ctx.fillStyle = '#ffa726';
      ctx.beginPath();
      if (side === 'left') {
        ctx.arc(0, 0, r * 0.88, -Math.PI / 2, Math.PI / 2, true);
      } else {
        ctx.arc(0, 0, r * 0.88, -Math.PI / 2, Math.PI / 2, false);
      }
      ctx.fill();

      ctx.strokeStyle = '#fff3e0';
      ctx.lineWidth = 1.5;
      const dir = side === 'left' ? -1 : 1;
      for (let a = -Math.PI / 3; a <= Math.PI / 3; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(dir * Math.cos(a) * (r * 0.85), Math.sin(a) * (r * 0.85));
        ctx.stroke();
      }
      break;
    }

    case 'apple': {
      // Creamy apple flesh + seed
      ctx.fillStyle = '#fffde7';
      ctx.beginPath();
      if (side === 'left') {
        ctx.arc(0, 0, r * 0.88, -Math.PI / 2, Math.PI / 2, true);
      } else {
        ctx.arc(0, 0, r * 0.88, -Math.PI / 2, Math.PI / 2, false);
      }
      ctx.fill();

      ctx.fillStyle = '#5d4037';
      const dir = side === 'left' ? -1 : 1;
      ctx.beginPath();
      ctx.ellipse(dir * (r * 0.25), 0, 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'pineapple': {
      // Golden yellow core
      ctx.fillStyle = '#ffee58';
      ctx.beginPath();
      if (side === 'left') {
        ctx.arc(0, 0, r * 0.88, -Math.PI / 2, Math.PI / 2, true);
      } else {
        ctx.arc(0, 0, r * 0.88, -Math.PI / 2, Math.PI / 2, false);
      }
      ctx.fill();
      break;
    }

    default:
      break;
  }

  ctx.restore();
}
