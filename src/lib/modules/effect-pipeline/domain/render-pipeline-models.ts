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

// Import ProcessingCapabilities from shared types
import type { ProcessingCapabilities } from '$shared/types/EffectTypes';
