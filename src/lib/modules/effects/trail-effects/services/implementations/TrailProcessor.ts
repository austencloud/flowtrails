/**
 * Trail Processor - Real-time video effect processing
 * Detects bright points (LEDs) and renders persistent trails
 */

export interface TrailConfig {
  ledThreshold: number;      // 0-1, brightness threshold for LED detection
  ledSensitivity: number;    // 0-2, multiplier for brightness
  trailLength: number;       // 0-1, how long trails persist (decay rate)
  trailFade: number;         // 0-1, trail opacity/intensity
}

export interface TrailProcessorOptions {
  sourceVideo: HTMLVideoElement;
  outputCanvas: HTMLCanvasElement;
  config: TrailConfig;
  onFrame?: (stats: FrameStats) => void;
}

export interface FrameStats {
  fps: number;
  detectedPoints: number;
  processingTime: number;
}

interface DetectedPoint {
  x: number;
  y: number;
  brightness: number;
  color: { r: number; g: number; b: number };
}

export class TrailProcessor {
  private sourceVideo: HTMLVideoElement;
  private outputCanvas: HTMLCanvasElement;
  private outputCtx: CanvasRenderingContext2D;

  // Offscreen canvases for processing
  private frameCanvas: HTMLCanvasElement;
  private frameCtx: CanvasRenderingContext2D;
  private trailCanvas: HTMLCanvasElement;
  private trailCtx: CanvasRenderingContext2D;

  private config: TrailConfig;
  private onFrame?: (stats: FrameStats) => void;

  private animationId: number | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;
  private fps = 0;

  private width = 0;
  private height = 0;

  constructor(options: TrailProcessorOptions) {
    this.sourceVideo = options.sourceVideo;
    this.outputCanvas = options.outputCanvas;
    this.config = { ...options.config };
    this.onFrame = options.onFrame;

    // Get output context
    const ctx = this.outputCanvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Failed to get 2D context for output canvas');
    this.outputCtx = ctx;

    // Create offscreen canvases
    this.frameCanvas = document.createElement('canvas');
    this.frameCtx = this.frameCanvas.getContext('2d', { willReadFrequently: true })!;

    this.trailCanvas = document.createElement('canvas');
    this.trailCtx = this.trailCanvas.getContext('2d')!;

    this.resize();

    // Draw initial frame so canvas isn't blank
    this.drawSingleFrame();

    console.log(`✅ TrailProcessor initialized: ${this.width}x${this.height}`);
  }

  resize(): void {
    this.width = this.sourceVideo.videoWidth || 720;
    this.height = this.sourceVideo.videoHeight || 720;

    // Size all canvases to match video
    this.outputCanvas.width = this.width;
    this.outputCanvas.height = this.height;
    this.frameCanvas.width = this.width;
    this.frameCanvas.height = this.height;
    this.trailCanvas.width = this.width;
    this.trailCanvas.height = this.height;

    // Clear trail canvas on resize
    this.trailCtx.fillStyle = 'black';
    this.trailCtx.fillRect(0, 0, this.width, this.height);
  }

  updateConfig(config: Partial<TrailConfig>): void {
    this.config = { ...this.config, ...config };
  }

  start(): void {
    if (this.animationId !== null) return;
    this.lastFrameTime = performance.now();
    this.processFrame();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  clearTrails(): void {
    this.trailCtx.fillStyle = 'black';
    this.trailCtx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Draw a single frame (useful for paused state)
   */
  drawSingleFrame(): void {
    // Just draw the video frame to output without processing
    this.outputCtx.drawImage(this.sourceVideo, 0, 0, this.width, this.height);
  }

  private processFrame = (): void => {
    const startTime = performance.now();

    // Check if video dimensions changed
    if (this.sourceVideo.videoWidth !== this.width ||
        this.sourceVideo.videoHeight !== this.height) {
      this.resize();
    }

    // Draw current video frame to frame canvas
    this.frameCtx.drawImage(this.sourceVideo, 0, 0, this.width, this.height);

    // Get frame pixel data for LED detection
    const frameData = this.frameCtx.getImageData(0, 0, this.width, this.height);

    // Detect bright points (LEDs)
    const detectedPoints = this.detectLeds(frameData);

    // Apply trail decay (fade existing trails)
    this.decayTrails();

    // Draw new trail points
    this.drawTrailPoints(detectedPoints);

    // Composite: trails + original video
    this.composite();

    // Calculate FPS
    this.frameCount++;
    const elapsed = startTime - this.lastFrameTime;
    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFrameTime = startTime;
    }

    // Report stats
    if (this.onFrame) {
      this.onFrame({
        fps: this.fps,
        detectedPoints: detectedPoints.length,
        processingTime: performance.now() - startTime
      });
    }

    // Continue loop
    this.animationId = requestAnimationFrame(this.processFrame);
  };

  private detectLeds(frameData: ImageData): DetectedPoint[] {
    const { data, width, height } = frameData;
    const points: DetectedPoint[] = [];

    const threshold = this.config.ledThreshold;
    const sensitivity = this.config.ledSensitivity;

    // Sample every few pixels for performance (adjust based on resolution)
    const step = Math.max(1, Math.floor(Math.min(width, height) / 200));

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate luminance (perceived brightness)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const adjustedLuminance = luminance * sensitivity;

        if (adjustedLuminance >= threshold) {
          points.push({
            x,
            y,
            brightness: adjustedLuminance,
            color: { r, g, b }
          });
        }
      }
    }

    return points;
  }

  private decayTrails(): void {
    // The trail length controls how quickly trails fade
    // trailLength = 1 means trails persist forever
    // trailLength = 0 means no trails (instant fade)
    const decay = 1 - (1 - this.config.trailLength) * 0.15;

    // Apply decay by drawing a semi-transparent black overlay
    this.trailCtx.fillStyle = `rgba(0, 0, 0, ${1 - decay})`;
    this.trailCtx.fillRect(0, 0, this.width, this.height);
  }

  private drawTrailPoints(points: DetectedPoint[]): void {
    const fade = this.config.trailFade;

    for (const point of points) {
      const { x, y, brightness, color } = point;

      // Size based on brightness
      const size = 2 + brightness * 8;

      // Create glowing effect
      const gradient = this.trailCtx.createRadialGradient(
        x, y, 0,
        x, y, size * 2
      );

      // Use the actual LED color with glow
      const alpha = Math.min(1, brightness * fade);
      gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
      gradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.6})`);
      gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

      this.trailCtx.fillStyle = gradient;
      this.trailCtx.beginPath();
      this.trailCtx.arc(x, y, size * 2, 0, Math.PI * 2);
      this.trailCtx.fill();
    }
  }

  private composite(): void {
    // Clear output
    this.outputCtx.fillStyle = 'black';
    this.outputCtx.fillRect(0, 0, this.width, this.height);

    // Draw original video (dimmed slightly to make trails pop)
    this.outputCtx.globalAlpha = 0.7;
    this.outputCtx.drawImage(this.sourceVideo, 0, 0, this.width, this.height);

    // Overlay trails with additive blending
    this.outputCtx.globalAlpha = 1;
    this.outputCtx.globalCompositeOperation = 'screen';
    this.outputCtx.drawImage(this.trailCanvas, 0, 0);

    // Reset composite operation
    this.outputCtx.globalCompositeOperation = 'source-over';
  }

  dispose(): void {
    this.stop();
  }
}

/**
 * Factory function for creating trail processor
 */
export function createTrailProcessor(options: TrailProcessorOptions): TrailProcessor {
  return new TrailProcessor(options);
}
