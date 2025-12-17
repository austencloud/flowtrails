/**
 * Effects State Management
 * Reactive state for LED detection and trail effects
 */

import type {
  ILedDetectionService,
  LedDetectionConfig,
  LedDetectionResult,
  ITrailEffectsService,
  TrailEffectsConfig,
  TrailEffectsResult
} from '$effects';

export interface EffectsState {
  // LED Detection
  ledDetection: {
    enabled: boolean;
    config: LedDetectionConfig;
    result: LedDetectionResult | null;
    processing: boolean;
  };
  
  // Trail Effects  
  trailEffects: {
    enabled: boolean;
    config: TrailEffectsConfig;
    result: TrailEffectsResult | null;
    processing: boolean;
  };
  
  // Overall state
  initialized: boolean;
  error: string | null;
  performance: {
    fps: number;
    processingTime: number;
  };
}

export function createEffectsState(ledDetectionService: ILedDetectionService) {
  
  // Reactive state
  let state = $state<EffectsState>({
    ledDetection: {
      enabled: true,
      config: {
        threshold: 0.7,
        sensitivity: 1.0,
        minArea: 1,
        maxArea: 50,
        colorWeights: { r: 0.299, g: 0.587, b: 0.114 }
      },
      result: null,
      processing: false
    },
    trailEffects: {
      enabled: true,
      config: {
        length: 0.8,
        fadeRate: 0.05,
        opacity: 1.0,
        blendMode: 'additive',
        tint: { r: 1, g: 1, b: 1, a: 0.1 },
        motionBlur: 0.0,
        thickness: 1.0
      },
      result: null,
      processing: false
    },
    initialized: false,
    error: null,
    performance: {
      fps: 0,
      processingTime: 0
    }
  });

  // Initialize services
  async function initialize(gl: WebGL2RenderingContext | GPUDevice) {
    try {
      state.error = null;
      
      if (state.ledDetection.enabled) {
        await ledDetectionService.initialize(gl);
      }
      
      state.initialized = true;
      console.log('✅ Effects services initialized');
    } catch (error) {
      state.error = `Failed to initialize effects: ${error}`;
      console.error('❌ Effects initialization failed:', error);
    }
  }

  // Update LED detection configuration
  function updateLedConfig(config: Partial<LedDetectionConfig>) {
    state.ledDetection.config = { ...state.ledDetection.config, ...config };
    ledDetectionService.updateConfig(state.ledDetection.config);
  }

  // Update trail effects configuration  
  function updateTrailConfig(config: Partial<TrailEffectsConfig>) {
    state.trailEffects.config = { ...state.trailEffects.config, ...config };
  }

  // Process frame through effects pipeline
  async function processFrame(inputTexture: WebGLTexture | GPUTexture) {
    if (!state.initialized) return null;

    const startTime = performance.now();
    
    try {
      let ledResult: LedDetectionResult | null = null;
      
      // LED Detection
      if (state.ledDetection.enabled) {
        state.ledDetection.processing = true;
        ledResult = await ledDetectionService.detectLeds(
          inputTexture, 
          state.ledDetection.config
        );
        state.ledDetection.result = ledResult;
        state.ledDetection.processing = false;
      }

      // Trail Effects (placeholder - service not implemented yet)
      if (state.trailEffects.enabled && ledResult) {
        state.trailEffects.processing = true;
        // TODO: Implement trail effects processing
        state.trailEffects.result = {
          outputTexture: inputTexture, // Placeholder
          processingTime: 0,
          frameCount: 0,
          bufferIndex: 0
        };
        state.trailEffects.processing = false;
      }

      const processingTime = performance.now() - startTime;
      state.performance.processingTime = processingTime;
      
      return ledResult?.maskTexture || inputTexture;
      
    } catch (error) {
      state.error = `Processing error: ${error}`;
      console.error('❌ Effects processing failed:', error);
      return null;
    }
  }

  // Toggle effects
  function toggleLedDetection() {
    state.ledDetection.enabled = !state.ledDetection.enabled;
  }

  function toggleTrailEffects() {
    state.trailEffects.enabled = !state.trailEffects.enabled;
  }

  // Cleanup
  function dispose() {
    if (ledDetectionService.isInitialized()) {
      ledDetectionService.dispose();
    }
    state.initialized = false;
  }

  return {
    // State access
    get state() { return state; },
    
    // LED Detection controls
    get ledThreshold() { return state.ledDetection.config.threshold; },
    set ledThreshold(value: number) { updateLedConfig({ threshold: value }); },
    
    get ledSensitivity() { return state.ledDetection.config.sensitivity; },
    set ledSensitivity(value: number) { updateLedConfig({ sensitivity: value }); },
    
    // Trail Effects controls
    get trailLength() { return state.trailEffects.config.length; },
    set trailLength(value: number) { updateTrailConfig({ length: value }); },
    
    get trailFade() { return state.trailEffects.config.fadeRate; },
    set trailFade(value: number) { updateTrailConfig({ fadeRate: value }); },
    
    // Actions
    initialize,
    processFrame,
    toggleLedDetection,
    toggleTrailEffects,
    updateLedConfig,
    updateTrailConfig,
    dispose
  };
}
