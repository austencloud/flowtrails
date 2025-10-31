/**
 * Effects Module - Barrel Export
 * Centralized exports for all effect-related functionality
 */

// LED Detection
export type { 
  ILedDetectionService,
  LedDetectionConfig,
  LedDetectionResult
} from './led-detection/services/contracts/ILedDetectionService';

export { LedDetectionService } from './led-detection/services/implementations/LedDetectionService';

export type {
  LedPosition,
  LedDetectionStats,
  LedDetectionPreset,
  LedDetectionMetrics
} from './led-detection/domain/LedDetectionModels';

export { 
  LED_DETECTION_PRESETS,
  LedDetectionMode 
} from './led-detection/domain/LedDetectionModels';

// Trail Effects
export type {
  ITrailEffectsService,
  TrailEffectsConfig,
  TrailEffectsResult
} from './trail-effects/services/contracts/ITrailEffectsService';

// Re-export for internal use
import type { LedDetectionConfig } from './led-detection/services/contracts/ILedDetectionService';
import type { TrailEffectsConfig } from './trail-effects/services/contracts/ITrailEffectsService';
import type { LedDetectionResult } from './led-detection/services/contracts/ILedDetectionService';
import type { TrailEffectsResult } from './trail-effects/services/contracts/ITrailEffectsService';

// Effects Module Types
export interface EffectsModuleConfig {
  /** Enable LED detection */
  enableLedDetection: boolean;
  
  /** Enable trail effects */
  enableTrailEffects: boolean;
  
  /** Default LED detection configuration */
  defaultLedConfig?: Partial<LedDetectionConfig>;
  
  /** Default trail effects configuration */
  defaultTrailConfig?: Partial<TrailEffectsConfig>;
  
  /** Performance settings */
  performance?: {
    maxFPS: number;
    enableGPUAcceleration: boolean;
    memoryLimit: number;
  };
}

export interface EffectsProcessingPipeline {
  /** Process a video frame through the effects pipeline */
  processFrame(
    inputTexture: WebGLTexture | GPUTexture,
    timestamp: number
  ): Promise<{
    outputTexture: WebGLTexture | GPUTexture;
    ledDetectionResult?: LedDetectionResult;
    trailEffectsResult?: TrailEffectsResult;
    processingTime: number;
  }>;
  
  /** Update pipeline configuration */
  updateConfig(config: Partial<EffectsModuleConfig>): void;
  
  /** Get current configuration */
  getConfig(): EffectsModuleConfig;
  
  /** Reset all effects */
  reset(): void;
  
  /** Cleanup resources */
  dispose(): void;
}

// State Management
export { createEffectsState } from './state/effects-state.svelte';

// Components
export { default as LedDetectionVisualizer } from './components/LedDetectionVisualizer.svelte';
