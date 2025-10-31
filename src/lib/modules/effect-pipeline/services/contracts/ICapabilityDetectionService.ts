/**
 * Contract for capability detection service
 */

import type { ProcessingCapabilities } from '$shared/types/EffectTypes';

export interface ICapabilityDetectionService {
  /**
   * Detect rendering capabilities of the current device
   */
  detectCapabilities(): ProcessingCapabilities;

  /**
   * Check if WebGPU is supported
   */
  supportsWebGPU(): boolean;

  /**
   * Check if WebGL2 is supported
   */
  supportsWebGL2(): boolean;

  /**
   * Check if WebGL is supported
   */
  supportsWebGL(): boolean;

  /**
   * Get maximum texture size
   */
  getMaxTextureSize(): number;

  /**
   * Estimate available GPU memory
   */
  estimateGPUMemory(): number;
}
