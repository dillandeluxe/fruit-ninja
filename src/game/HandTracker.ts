import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { Point2D } from './types';

export interface HandTrackerCallbacks {
  onHandsDetected: (p1Points: Point2D[], p2Points: Point2D[], playersDetected: number) => void;
  onStatusChange: (status: 'loading' | 'ready' | 'error' | 'no-camera', message?: string) => void;
}

export class HandTracker {
  private handLandmarker: HandLandmarker | null = null;
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private callbacks: HandTrackerCallbacks;
  private isRunning: boolean = false;
  private lastVideoTime: number = -1;
  private mirror: boolean = true;
  private smoothedPoints: Map<number, Point2D> = new Map();

  constructor(callbacks: HandTrackerCallbacks) {
    this.callbacks = callbacks;
  }

  public setMirror(mirror: boolean) {
    this.mirror = mirror;
  }

  public async initialize(): Promise<void> {
    this.callbacks.onStatusChange('loading', 'Loading MediaPipe AI Hand Tracking...');

    try {
      let vision;
      try {
        vision = await FilesetResolver.forVisionTasks('/wasm');
      } catch {
        console.warn('Local WASM failed, attempting CDN fallback...');
        vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
      }

      // Track up to 4 hands concurrently (enables 2 players with up to 2 hands each)
      try {
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 4,
        });
      } catch (gpuError) {
        console.warn('GPU delegate failed, falling back to CPU delegate...', gpuError);
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 4,
        });
      }

      this.callbacks.onStatusChange('ready', 'Hand tracker ready. Requesting camera...');
    } catch (err) {
      console.error('Failed to initialize HandLandmarker:', err);
      this.callbacks.onStatusChange('error', 'Could not load hand tracker. Mouse & touch active.');
      throw err;
    }
  }

  public async startCamera(videoElement: HTMLVideoElement): Promise<void> {
    this.video = videoElement;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 60, min: 30 },
        },
        audio: false,
      });

      this.video.srcObject = this.stream;
      await new Promise<void>((resolve) => {
        if (!this.video) return resolve();
        this.video.onloadedmetadata = () => {
          this.video?.play().then(() => resolve()).catch(() => resolve());
        };
      });

      this.isRunning = true;
      this.callbacks.onStatusChange('ready', 'Camera active! Wave your hands to slice.');
    } catch (err) {
      console.error('Failed to access camera:', err);
      this.callbacks.onStatusChange(
        'no-camera',
        'Camera access denied. Mouse & touch active.'
      );
      throw err;
    }
  }

  public update(width: number, height: number): { p1Points: Point2D[]; p2Points: Point2D[]; playersDetected: number } {
    if (!this.isRunning || !this.video || !this.handLandmarker || this.video.readyState < 2) {
      return { p1Points: [], p2Points: [], playersDetected: 0 };
    }

    const p1Points: Point2D[] = [];
    const p2Points: Point2D[] = [];

    try {
      const now = performance.now();
      if (this.video.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = this.video.currentTime;
        const results = this.handLandmarker.detectForVideo(this.video, now);

        if (results && results.landmarks && results.landmarks.length > 0) {
          results.landmarks.forEach((landmarks, handIndex) => {
            const tip = landmarks[8]; // Index finger tip
            if (!tip) return;

            const targetX = this.mirror ? (1 - tip.x) * width : tip.x * width;
            const targetY = tip.y * height;

            let prev = this.smoothedPoints.get(handIndex);
            if (!prev) {
              prev = { x: targetX, y: targetY };
            } else {
              prev = {
                x: prev.x * 0.35 + targetX * 0.65,
                y: prev.y * 0.35 + targetY * 0.65,
              };
            }
            this.smoothedPoints.set(handIndex, prev);

            // Separate players spatially: Left side is Player 1, Right side is Player 2
            if (prev.x < width * 0.5) {
              p1Points.push({ x: prev.x, y: prev.y });
            } else {
              p2Points.push({ x: prev.x, y: prev.y });
            }
          });
        } else {
          this.smoothedPoints.clear();
        }
      }
    } catch {
      // Ignore transient frame detection drops
    }

    const playersDetected = (p1Points.length > 0 ? 1 : 0) + (p2Points.length > 0 ? 1 : 0);
    this.callbacks.onHandsDetected(p1Points, p2Points, playersDetected);
    return { p1Points, p2Points, playersDetected };
  }

  public getVideo(): HTMLVideoElement | null {
    return this.video;
  }

  public stop() {
    this.isRunning = false;
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    this.smoothedPoints.clear();
  }
}
