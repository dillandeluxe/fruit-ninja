export type GameMode = 'classic' | 'zen' | 'meeting' | 'duel';

export type FruitType = 
  | 'watermelon' 
  | 'apple' 
  | 'orange' 
  | 'banana' 
  | 'strawberry' 
  | 'pineapple' 
  | 'dragonfruit' 
  | 'bomb';

export type BladeColor = 
  | 'crimson' 
  | 'cyan' 
  | 'gold' 
  | 'neonGreen' 
  | 'cyberViolet' 
  | 'rainbow';

export interface Point2D {
  x: number;
  y: number;
}

export interface BladeTrailPoint {
  x: number;
  y: number;
  time: number;
  speed: number;
}

export interface DuelStats {
  p1Score: number;
  p2Score: number;
  p1Slices: number;
  p2Slices: number;
  p1Combo: number;
  p2Combo: number;
  winner: 'p1' | 'p2' | 'tie' | null;
}

export interface GameStats {
  score: number;
  strikes: number;
  maxStrikes: number;
  combo: number;
  maxCombo: number;
  fruitsSliced: number;
  bombsHit: number;
  timeLeft: number; // For Zen / Duel mode (seconds)
  duel: DuelStats;
  playersDetected: number; // 1 or 2 players currently on screen
}

export interface GameSettings {
  bladeColor: BladeColor;
  sliceSensitivity: number; // 0.8 to 1.5
  soundEnabled: boolean;
  sfxVolume: number;
  mirrorCamera: boolean;
  cameraFilter: 'normal' | 'vibrant' | 'cyberpunk' | 'comic';
  streamOverlayMode: boolean;
  twoHandsEnabled: boolean;
  showWebcamFeed: boolean;
  gameMode: GameMode;
}

export interface FruitConfig {
  type: FruitType;
  name: string;
  radius: number;
  points: number;
  juiceColor: string;
  splashColor: string;
  innerColor: string;
  outerColor: string;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  alpha: number;
  vy: number;
  scale: number;
}
