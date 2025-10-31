/**
 * Trail effects types and interfaces
 */

export interface TrailParameters {
  // Core trail properties
  length: number;        // Trail length in frames (1-100)
  decay: number;         // Trail fade rate (0.1-1.0)
  thickness: number;     // Trail thickness in pixels (1-20)
  density: number;       // Trail density/opacity (0.1-1.0)
  
  // Visual properties
  color: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  blendMode: 'add' | 'multiply' | 'screen' | 'overlay' | 'normal';
  
  // Advanced effects
  motionBlur: boolean;
  glowIntensity: number; // Glow effect strength (0-2.0)
  sparkleEffect: boolean; // Add sparkle particles
  
  // Performance
  quality: 'low' | 'medium' | 'high' | 'ultra';
}

export interface TrailFrame {
  timestamp: number;
  pixels: Uint8ClampedArray; // RGBA pixel data
  opacity: number;           // Frame opacity for decay
  transformMatrix?: Float32Array; // Optional transform for motion
}

export interface TrailBuffer {
  frames: TrailFrame[];
  maxFrames: number;
  currentFrame: number;
  width: number;
  height: number;
}

export interface TrailRenderContext {
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;
  
  // Render resources
  pipeline: GPURenderPipeline;
  bindGroup: GPUBindGroup;
  
  // Buffers
  vertexBuffer: GPUBuffer;
  uniformBuffer: GPUBuffer;
  
  // Textures
  currentTexture: GPUTexture;
  previousTexture: GPUTexture;
  trailTexture: GPUTexture;
}

export interface TrailEffectResult {
  processedFrame: ImageData;
  renderTimeMs: number;
  trailPixelCount: number;
  memoryUsageMB: number;
}

export type TrailQualityPreset = {
  maxFrames: number;
  textureFiltering: 'nearest' | 'linear';
  antialiasing: boolean;
  subPixelRendering: boolean;
};

export const TRAIL_QUALITY_PRESETS: Record<TrailParameters['quality'], TrailQualityPreset> = {
  low: {
    maxFrames: 10,
    textureFiltering: 'nearest',
    antialiasing: false,
    subPixelRendering: false
  },
  medium: {
    maxFrames: 20,
    textureFiltering: 'linear',
    antialiasing: false,
    subPixelRendering: false
  },
  high: {
    maxFrames: 30,
    textureFiltering: 'linear',
    antialiasing: true,
    subPixelRendering: false
  },
  ultra: {
    maxFrames: 60,
    textureFiltering: 'linear',
    antialiasing: true,
    subPixelRendering: true
  }
};
