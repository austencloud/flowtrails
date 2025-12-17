/**
 * Trail Effects Service Implementation
 * Creates trailing effects using frame buffer ping-pong technique
 */

import { injectable } from 'inversify';
import type {
  ITrailEffectsService,
  TrailEffectsConfig,
  TrailEffectsResult
} from '../contracts/ITrailEffectsService';

const DEFAULT_CONFIG: TrailEffectsConfig = {
  length: 0.5,
  fadeRate: 0.1,
  opacity: 0.8,
  blendMode: 'additive',
  motionBlur: 0,
  thickness: 1
};

@injectable()
export class TrailEffectsService implements ITrailEffectsService {
  private initialized = false;
  private config: TrailEffectsConfig = { ...DEFAULT_CONFIG };
  private width = 0;
  private height = 0;
  private frameCount = 0;
  private bufferIndex = 0;

  // WebGL resources (WebGPU support can be added later)
  private gl: WebGL2RenderingContext | null = null;
  private frameBuffers: WebGLFramebuffer[] = [];
  private textures: WebGLTexture[] = [];

  async initialize(
    context: WebGL2RenderingContext | GPUDevice,
    width: number,
    height: number
  ): Promise<void> {
    if (context instanceof WebGL2RenderingContext) {
      this.gl = context;
      this.width = width;
      this.height = height;
      this.createFrameBuffers();
      this.initialized = true;
      console.log(`✅ TrailEffectsService initialized (${width}x${height})`);
    } else {
      // GPUDevice - WebGPU support placeholder
      console.warn('WebGPU trail effects not yet implemented');
      this.initialized = true;
    }
  }

  private createFrameBuffers(): void {
    if (!this.gl) return;

    // Create ping-pong buffers (2 frame buffers for accumulation)
    for (let i = 0; i < 2; i++) {
      const texture = this.gl.createTexture();
      if (!texture) continue;

      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.width,
        this.height,
        0,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        null
      );
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

      const fb = this.gl.createFramebuffer();
      if (!fb) continue;

      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0,
        this.gl.TEXTURE_2D,
        texture,
        0
      );

      this.textures.push(texture);
      this.frameBuffers.push(fb);
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  async processFrame(
    inputTexture: WebGLTexture | GPUTexture,
    maskTexture: WebGLTexture | GPUTexture | null,
    config: TrailEffectsConfig
  ): Promise<TrailEffectsResult> {
    const startTime = performance.now();
    this.config = { ...this.config, ...config };

    // Ping-pong buffer swap
    const readIndex = this.bufferIndex;
    const writeIndex = (this.bufferIndex + 1) % 2;

    // TODO: Implement actual trail compositing shader
    // For now, return placeholder result

    this.bufferIndex = writeIndex;
    this.frameCount++;

    return {
      outputTexture: this.textures[writeIndex] || inputTexture,
      processingTime: performance.now() - startTime,
      frameCount: this.frameCount,
      bufferIndex: this.bufferIndex
    };
  }

  updateConfig(config: Partial<TrailEffectsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): TrailEffectsConfig {
    return { ...this.config };
  }

  clearTrails(): void {
    if (!this.gl) return;

    // Clear both frame buffers
    for (const fb of this.frameBuffers) {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.frameCount = 0;
    this.bufferIndex = 0;
  }

  resize(width: number, height: number): void {
    if (width === this.width && height === this.height) return;

    this.width = width;
    this.height = height;

    // Recreate frame buffers at new size
    this.dispose();
    if (this.gl) {
      this.createFrameBuffers();
    }
  }

  dispose(): void {
    if (!this.gl) return;

    for (const fb of this.frameBuffers) {
      this.gl.deleteFramebuffer(fb);
    }
    for (const tex of this.textures) {
      this.gl.deleteTexture(tex);
    }

    this.frameBuffers = [];
    this.textures = [];
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
