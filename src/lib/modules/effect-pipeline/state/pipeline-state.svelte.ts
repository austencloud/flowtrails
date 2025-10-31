/**
 * Reactive state management for the effect pipeline
 */

import type { RenderBackend, RenderPipelineConfig } from '../domain/render-pipeline-models';
import type { ProcessingCapabilities } from '$shared/types/EffectTypes';
import type { EffectPipeline } from '$shared';
import type { IRenderPipelineService } from '../services/contracts/IRenderPipelineService';
import { MODULE_EVENTS, ModuleEventDispatcher, resolve, TYPES } from '$shared';

export function createPipelineState() {
  // Get service from DI container
  const pipelineService = resolve<IRenderPipelineService>(TYPES.IRenderPipelineService);

  // Reactive state
  let initialized = $state(false);
  let backend: RenderBackend | null = $state(null);
  let capabilities: ProcessingCapabilities | null = $state(null);
  let renderTargets: EffectPipeline | null = $state(null);
  let loading = $state(false);
  let error = $state<string | null>(null);

  // Derived state
  const isWebGPU = $derived(() => backend === 'webgpu');
  const isWebGL = $derived(() => backend === 'webgl2' || backend === 'webgl');
  const supportsHighPerformance = $derived(() => 
    capabilities?.supportsWebGPU || capabilities?.supportsWebGL2
  );
  const maxResolution = $derived(() => capabilities?.maxResolution || { width: 1920, height: 1080 });

  // Actions
  async function initializePipeline(canvas: HTMLCanvasElement, config?: Partial<RenderPipelineConfig>) {
    loading = true;
    error = null;

    try {
      const pipelineConfig: RenderPipelineConfig = {
        preferredBackend: 'webgpu',
        canvas,
        width: canvas.width || 1920,
        height: canvas.height || 1080,
        enableFloatTextures: true,
        ...config
      };

      const result = await pipelineService.initialize(pipelineConfig);

      backend = result.backend;
      capabilities = result.capabilities;
      renderTargets = result.renderTargets;
      initialized = true;

      console.log(`✅ Pipeline initialized with ${backend} backend`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to initialize pipeline';
      console.error('Pipeline initialization error:', err);
    } finally {
      loading = false;
    }
  }

  async function resizePipeline(width: number, height: number) {
    if (initialized) {
      try {
        await pipelineService.resize(width, height);
        renderTargets = pipelineService.getPipeline();
      } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to resize pipeline';
        console.error('Pipeline resize error:', err);
      }
    }
  }

  function destroyPipeline() {
    if (initialized) {
      pipelineService.destroy();
      initialized = false;
      backend = null;
      capabilities = null;
      renderTargets = null;
      error = null;
    }
  }

  // Event listeners for inter-module communication (client-side only)
  function setupEventListeners() {
    if (typeof window === 'undefined') return () => {}; // Skip on server

    // Listen for video loaded events to auto-resize pipeline
    const cleanupVideoLoaded = ModuleEventDispatcher.listen(
      MODULE_EVENTS.VIDEO_LOADED,
      (event) => {
        const { metadata } = event.detail;
        if (initialized && metadata) {
          resizePipeline(metadata.width, metadata.height);
        }
      }
    );

    // Cleanup function
    return () => {
      cleanupVideoLoaded();
    };
  }

  // Auto-setup event listeners
  const cleanup = setupEventListeners();

  return {
    // State
    get pipelineService() { return pipelineService; },
    get initialized() { return initialized; },
    get backend() { return backend; },
    get capabilities() { return capabilities; },
    get renderTargets() { return renderTargets; },
    get loading() { return loading; },
    get error() { return error; },

    // Derived state
    get isWebGPU() { return isWebGPU; },
    get isWebGL() { return isWebGL; },
    get supportsHighPerformance() { return supportsHighPerformance; },
    get maxResolution() { return maxResolution; },

    // Actions
    initializePipeline,
    resizePipeline,
    destroyPipeline,

    // Cleanup
    cleanup
  };
}
