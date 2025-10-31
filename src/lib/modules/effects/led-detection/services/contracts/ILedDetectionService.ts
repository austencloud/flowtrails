/**
 * LED Detection Service Contract
 * Detects bright pixels (LEDs) in video frames using brightness thresholding
 */

export interface LedDetectionConfig {
  /** Brightness threshold (0-1, where 1 is pure white) */
  threshold: number;
  
  /** Sensitivity multiplier for detection (0-2) */
  sensitivity: number;
  
  /** Minimum pixel area for LED detection */
  minArea?: number;
  
  /** Maximum pixel area for LED detection */
  maxArea?: number;
  
  /** Color channel weights for luminance calculation */
  colorWeights?: {
    r: number;
    g: number;
    b: number;
  };
}

export interface LedDetectionResult {
  /** Detected LED positions */
  leds: Array<{
    x: number;
    y: number;
    brightness: number;
    area: number;
  }>;
  
  /** Binary mask texture of detected pixels */
  maskTexture: WebGLTexture | GPUTexture;
  
  /** Processing time in milliseconds */
  processingTime: number;
  
  /** Number of detected LEDs */
  ledCount: number;
}

export interface ILedDetectionService {
  /**
   * Initialize the LED detection system with WebGL/WebGPU context
   */
  initialize(gl: WebGL2RenderingContext | GPUDevice): Promise<void>;
  
  /**
   * Process a video frame to detect LEDs
   */
  detectLeds(
    inputTexture: WebGLTexture | GPUTexture,
    config: LedDetectionConfig
  ): Promise<LedDetectionResult>;
  
  /**
   * Update detection configuration
   */
  updateConfig(config: Partial<LedDetectionConfig>): void;
  
  /**
   * Get current configuration
   */
  getConfig(): LedDetectionConfig;
  
  /**
   * Cleanup resources
   */
  dispose(): void;
  
  /**
   * Check if service is initialized
   */
  isInitialized(): boolean;
}
