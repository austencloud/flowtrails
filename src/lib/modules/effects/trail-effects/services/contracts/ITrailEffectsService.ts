/**
 * Trail Effects Service Contract
 * Creates trailing effects using frame buffer ping-pong technique
 */

export interface TrailEffectsConfig {
  /** Trail length (0-1, where 1 is infinite trails) */
  length: number;
  
  /** Fade rate per frame (0-1, where 0 is no fade, 1 is instant fade) */
  fadeRate: number;
  
  /** Trail opacity (0-1) */
  opacity: number;
  
  /** Blend mode for trail composition */
  blendMode: 'normal' | 'additive' | 'multiply' | 'screen' | 'overlay';
  
  /** Color tint for trails */
  tint?: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  
  /** Motion blur amount (0-1) */
  motionBlur?: number;
  
  /** Trail thickness multiplier */
  thickness?: number;
}

export interface TrailEffectsResult {
  /** Output texture with trail effects applied */
  outputTexture: WebGLTexture | GPUTexture;
  
  /** Processing time in milliseconds */
  processingTime: number;
  
  /** Number of frames in trail buffer */
  frameCount: number;
  
  /** Current frame buffer index */
  bufferIndex: number;
}

export interface ITrailEffectsService {
  /**
   * Initialize the trail effects system with WebGL/WebGPU context
   */
  initialize(
    gl: WebGL2RenderingContext | GPUDevice,
    width: number,
    height: number
  ): Promise<void>;
  
  /**
   * Process a frame to create trail effects
   */
  processFrame(
    inputTexture: WebGLTexture | GPUTexture,
    maskTexture: WebGLTexture | GPUTexture | null,
    config: TrailEffectsConfig
  ): Promise<TrailEffectsResult>;
  
  /**
   * Update trail configuration
   */
  updateConfig(config: Partial<TrailEffectsConfig>): void;
  
  /**
   * Get current configuration
   */
  getConfig(): TrailEffectsConfig;
  
  /**
   * Clear trail buffer (reset trails)
   */
  clearTrails(): void;
  
  /**
   * Resize frame buffers
   */
  resize(width: number, height: number): void;
  
  /**
   * Cleanup resources
   */
  dispose(): void;
  
  /**
   * Check if service is initialized
   */
  isInitialized(): boolean;
}
