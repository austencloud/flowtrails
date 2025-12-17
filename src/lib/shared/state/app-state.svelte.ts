/**
 * Unified Application State
 * Coordinates all module states with reactive cross-module communication
 * Uses Svelte 5 runes for true reactive architecture
 */

import { resolve, TYPES } from '$shared/inversify';
import { createVideoState } from '$video/state/video-state.svelte';
import { createPipelineState } from '$pipeline/state/pipeline-state.svelte';
import { createEffectsState } from '$effects/state/effects-state.svelte';
import type { IVideoManagerService } from '$video';
import type { IRenderPipelineService } from '$pipeline/services/contracts/IRenderPipelineService';
import type { ICapabilityDetectionService } from '$pipeline/services/contracts/ICapabilityDetectionService';
import type { ILedDetectionService } from '$effects/led-detection/services/contracts/ILedDetectionService';
import type { IVideoSyncService } from '$video/services/contracts/IVideoSyncService';

/**
 * Creates the unified application state with cross-module reactive coordination
 * This is the single source of truth for the entire application
 */
export function createAppState() {
  // Resolve services from DI container
  const videoService = resolve<IVideoManagerService>(TYPES.IVideoManagerService);
  const videoSyncService = resolve<IVideoSyncService>(TYPES.IVideoSyncService);
  const pipelineService = resolve<IRenderPipelineService>(TYPES.IRenderPipelineService);
  const capabilityService = resolve<ICapabilityDetectionService>(TYPES.ICapabilityDetectionService);
  const ledDetectionService = resolve<ILedDetectionService>(TYPES.ILedDetectionService);

  // Create module states with injected services
  const video = createVideoState(videoService);
  const pipeline = createPipelineState(pipelineService);
  const effects = createEffectsState(ledDetectionService);

  // Cross-module reactive coordination using $effect
  // This replaces the old event-driven approach with pure reactivity

  // When video loads, auto-resize pipeline to match video dimensions
  $effect(() => {
    if (video.currentVideo && pipeline.initialized) {
      const { width, height } = video.currentVideo.metadata;
      console.log(`📐 Video loaded: ${width}x${height}, resizing pipeline...`);
      pipeline.resizePipeline(width, height);
    }
  });

  // When pipeline is initialized, initialize effects
  $effect(() => {
    if (pipeline.initialized && !effects.state.initialized) {
      const backend = pipeline.backend;
      console.log(`🎨 Pipeline ready with ${backend}, initializing effects...`);

      // Get the appropriate context based on backend
      // Note: This is simplified - in real implementation, you'd get the actual context
      // For now, we'll skip auto-initialization and let components handle it
    }
  });

  // Log state changes for debugging (only in dev)
  if (import.meta.env.DEV) {
    $effect(() => {
      if (video.currentVideo) {
        console.log('📹 Video state changed:', {
          name: video.currentVideo.metadata.name,
          duration: video.currentVideo.metadata.duration,
          dimensions: `${video.currentVideo.metadata.width}x${video.currentVideo.metadata.height}`
        });
      }
    });

    $effect(() => {
      if (pipeline.initialized) {
        console.log('⚡ Pipeline state changed:', {
          backend: pipeline.backend,
          capabilities: pipeline.capabilities
        });
      }
    });
  }

  return {
    // Module states
    video,
    pipeline,
    effects,

    // Services (for advanced use cases)
    services: {
      video: videoService,
      videoSync: videoSyncService,
      pipeline: pipelineService,
      capability: capabilityService,
      ledDetection: ledDetectionService
    },

    // Global cleanup
    destroy() {
      video.unloadVideo();
      pipeline.destroyPipeline();
      effects.dispose();
    }
  };
}

/**
 * Type helper for the app state
 */
export type AppState = ReturnType<typeof createAppState>;
