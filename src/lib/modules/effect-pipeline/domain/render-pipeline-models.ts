/**
 * Domain models and types for the effect pipeline
 */

import type { EffectPipeline } from '$shared';

export type RenderBackend = 'webgpu' | 'webgl2' | 'webgl';

export interface RenderPipelineConfig {
  preferredBackend: RenderBackend;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  enableFloatTextures: boolean;
}

export interface PipelineInitializationResult {
  backend: RenderBackend;
  capabilities: ProcessingCapabilities;
  renderTargets: EffectPipeline;
}

export interface ProcessingCapabilities {
  maxResolution: { width: number; height: number };
  maxFPS: number;
  supportsWebGPU: boolean;
  supportsWebGL2: boolean;
  supportsFloatTextures: boolean;
  memoryLimit: number; // MB
}
