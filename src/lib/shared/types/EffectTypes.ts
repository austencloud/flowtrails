/**
 * Effect processing types for ARFlowArts trail effects
 */

export interface ThresholdParameters {
  type: 'color' | 'brightness' | 'combined';
  
  // Color threshold parameters
  colorHue?: number;        // 0-360
  colorSaturation?: number; // 0-100
  colorTolerance?: number;  // 0-100
  
  // Brightness threshold parameters
  brightnessMin?: number;   // 0-255
  brightnessMax?: number;   // 0-255
  
  // Combined parameters
  weight?: number;          // 0-1, how much to weight color vs brightness
}

export interface TrailEffectParameters {
  decay: number;           // 0-1, how quickly trails fade
  thickness: number;       // 1-50, trail thickness in pixels
  intensity: number;       // 0-1, trail brightness multiplier
  color: string;          // CSS color string
  blendMode: BlendMode;   // How trails blend with video
  smoothing: number;      // 0-1, trail edge smoothing
}

export type BlendMode = 
  | 'normal'
  | 'multiply' 
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'color-dodge'
  | 'color-burn'
  | 'darken'
  | 'lighten'
  | 'difference'
  | 'exclusion';

export interface EffectPreset {
  id: string;
  name: string;
  description: string;
  threshold: ThresholdParameters;
  trail: TrailEffectParameters;
  thumbnail?: string;
}

export interface DetectionMask {
  width: number;
  height: number;
  data: Uint8Array; // Binary mask data
  timestamp: number;
}

export interface RenderTarget {
  width: number;
  height: number;
  texture: WebGLTexture | GPUTexture;
  framebuffer?: WebGLFramebuffer;
}

export interface EffectPipeline {
  inputTarget: RenderTarget;
  trailBuffer: RenderTarget;
  outputTarget: RenderTarget;
  maskTexture: WebGLTexture | GPUTexture;
}

export type ProcessingQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface ProcessingCapabilities {
  maxResolution: { width: number; height: number };
  maxFPS: number;
  supportsWebGPU: boolean;
  supportsWebGL2: boolean;
  supportsFloatTextures: boolean;
  memoryLimit: number; // MB
}
