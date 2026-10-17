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
  private lastP1Points: Point2D[] = [];
  private lastP2Points: Point2D[] = [];

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

      // Track up to 4 hands concurrently
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
      return { p1Points: this.lastP1Points, p2Points: this.lastP2Points, playersDetected: 0 };
    }

    try {
      const now = performance.now();
      if (this.video.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = this.video.currentTime;
        const results = this.handLandmarker.detectForVideo(this.video, now);

        const vW = this.video.videoWidth || 1280;
        const vH = this.video.videoHeight || 720;
        const videoRatio = vW / vH;
        const canvasRatio = width / height;

        let drawW = width;
        let drawH = height;
        let offsetX = 0;
        let offsetY = 0;

        if (videoRatio > canvasRatio) {
          drawW = height * videoRatio;
          offsetX = -(drawW - width) / 2;
        } else {
          drawH = width / videoRatio;
          offsetY = -(drawH - height) / 2;
        }

        const currentP1: Point2D[] = [];
        const currentP2: Point2D[] = [];

        if (results && results.landmarks && results.landmarks.length > 0) {
          results.landmarks.forEach((landmarks, handIndex) => {
            // Index fingertip is landmark 8. Fallback to middle finger 12 or knuckle 9
            const tip = landmarks[8] || landmarks[12] || landmarks[9];
            if (!tip) return;

            // Map normalized coordinates directly to where the video renders on canvas
            const normX = this.mirror ? (1 - tip.x) : tip.x;
            const targetX = offsetX + normX * drawW;
            const targetY = offsetY + tip.y * drawH;

            let prev = this.smoothedPoints.get(handIndex);
            if (!prev) {
              prev = { x: targetX, y: targetY };
            } else {
              // Fast responsive smoothing: 80% new position, 20% history
              prev = {
                x: prev.x * 0.2 + targetX * 0.8,
                y: prev.y * 0.2 + targetY * 0.8,
              };
            }
            this.smoothedPoints.set(handIndex, prev);

            // Separate players spatially: Left half is Player 1, Right half is Player 2
            if (prev.x < width * 0.5) {
              currentP1.push({ x: prev.x, y: prev.y });
            } else {
              currentP2.push({ x: prev.x, y: prev.y });
            }
          });

          this.lastP1Points = currentP1;
          this.lastP2Points = currentP2;
        } else {
          this.smoothedPoints.clear();
          this.lastP1Points = [];
          this.lastP2Points = [];
        }
      }
    } catch {
      // Ignore transient frame detection drops
    }

    const playersDetected = (this.lastP1Points.length > 0 ? 1 : 0) + (this.lastP2Points.length > 0 ? 1 : 0);
    this.callbacks.onHandsDetected(this.lastP1Points, this.lastP2Points, playersDetected);
    return { p1Points: this.lastP1Points, p2Points: this.lastP2Points, playersDetected };
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
    this.lastP1Points = [];
    this.lastP2Points = [];
  }
}
