/**
 * Contract for render pipeline service
 */

import type { 
  RenderPipelineConfig, 
  RenderBackend, 
  PipelineInitializationResult,
  ProcessingCapabilities 
} from '../../domain/render-pipeline-models';
import type { EffectPipeline } from '$shared';

export interface IRenderPipelineService {
  /**
   * Initialize the rendering pipeline with the best available backend
   */
  initialize(config: RenderPipelineConfig): Promise<PipelineInitializationResult>;

  /**
   * Resize render targets
   */
  resize(width: number, height: number): Promise<void>;

  /**
   * Get current pipeline
   */
  getPipeline(): EffectPipeline | null;

  /**
   * Get current backend
   */
  getBackend(): RenderBackend | null;

  /**
   * Get capabilities
   */
  getCapabilities(): ProcessingCapabilities | null;

  /**
   * Cleanup resources
   */
  destroy(): void;
}
