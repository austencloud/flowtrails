/**
 * Inter-module communication events for ARFlowArts
 * Enables loose coupling between modules while maintaining clear data flow
 */

export const MODULE_EVENTS = {
  // Video Management Events
  VIDEO_LOADED: 'video:loaded',
  VIDEO_UNLOADED: 'video:unloaded',
  VIDEO_PLAY: 'video:play',
  VIDEO_PAUSE: 'video:pause',
  VIDEO_SEEK: 'video:seek',
  VIDEO_METADATA_READY: 'video:metadata-ready',

  // Effect Pipeline Events
  PIPELINE_INITIALIZED: 'pipeline:initialized',
  PIPELINE_DESTROYED: 'pipeline:destroyed',
  RENDER_TARGET_READY: 'pipeline:render-target-ready',
  FRAME_PROCESSED: 'pipeline:frame-processed',

  // Threshold Detection Events
  THRESHOLD_CHANGED: 'threshold:changed',
  DETECTION_MASK_UPDATED: 'threshold:mask-updated',
  DETECTION_PARAMETERS_SAVED: 'threshold:parameters-saved',

  // Trail Effects Events
  TRAIL_EFFECT_APPLIED: 'trails:effect-applied',
  TRAIL_PARAMETERS_CHANGED: 'trails:parameters-changed',
  TRAIL_BUFFER_CLEARED: 'trails:buffer-cleared',

  // Video Export Events
  EXPORT_STARTED: 'export:started',
  EXPORT_PROGRESS: 'export:progress',
  EXPORT_COMPLETED: 'export:completed',
  EXPORT_FAILED: 'export:failed',
  EXPORT_CANCELLED: 'export:cancelled'
} as const;

export type ModuleEventType = typeof MODULE_EVENTS[keyof typeof MODULE_EVENTS];

/**
 * Type-safe event data interfaces
 */
export interface VideoLoadedEvent {
  video: HTMLVideoElement;
  metadata: {
    duration: number;
    width: number;
    height: number;
    fps: number;
    format: string;
  };
}

export interface ThresholdChangedEvent {
  type: 'color' | 'brightness' | 'combined';
  parameters: {
    colorHue?: number;
    colorSaturation?: number;
    colorTolerance?: number;
    brightnessMin?: number;
    brightnessMax?: number;
  };
}

export interface TrailParametersEvent {
  decay: number;
  thickness: number;
  intensity: number;
  color: string;
  blendMode: string;
}

export interface ExportProgressEvent {
  progress: number; // 0-1
  currentFrame: number;
  totalFrames: number;
  estimatedTimeRemaining: number;
}

/**
 * Type-safe event dispatcher
 */
export class ModuleEventDispatcher {
  static dispatch<T = any>(eventType: ModuleEventType, detail: T): void {
    window.dispatchEvent(new CustomEvent(eventType, { detail }));
  }

  static listen<T = any>(
    eventType: ModuleEventType, 
    handler: (event: CustomEvent<T>) => void
  ): () => void {
    window.addEventListener(eventType, handler as EventListener);
    
    // Return cleanup function
    return () => {
      window.removeEventListener(eventType, handler as EventListener);
    };
  }
}
