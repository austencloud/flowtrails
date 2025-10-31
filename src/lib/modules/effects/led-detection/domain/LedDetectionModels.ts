/**
 * Domain models for LED Detection
 */

export interface LedPosition {
  /** X coordinate (0-1 normalized) */
  x: number;
  
  /** Y coordinate (0-1 normalized) */
  y: number;
  
  /** Brightness value (0-1) */
  brightness: number;
  
  /** Detected area in pixels */
  area: number;
  
  /** Confidence score (0-1) */
  confidence?: number;
  
  /** Color information */
  color?: {
    r: number;
    g: number;
    b: number;
  };
}

export interface LedDetectionStats {
  /** Total number of LEDs detected */
  totalLeds: number;
  
  /** Average brightness of detected LEDs */
  averageBrightness: number;
  
  /** Processing time in milliseconds */
  processingTime: number;
  
  /** Frame rate (FPS) */
  frameRate: number;
  
  /** Detection accuracy (if ground truth available) */
  accuracy?: number;
}

export interface LedDetectionPreset {
  /** Preset name */
  name: string;
  
  /** Description */
  description: string;
  
  /** Configuration values */
  config: {
    threshold: number;
    sensitivity: number;
    minArea?: number;
    maxArea?: number;
    colorWeights?: {
      r: number;
      g: number;
      b: number;
    };
  };
}

export const LED_DETECTION_PRESETS: LedDetectionPreset[] = [
  {
    name: 'Standard',
    description: 'Balanced detection for most LED props',
    config: {
      threshold: 0.7,
      sensitivity: 1.0,
      minArea: 1,
      maxArea: 50
    }
  },
  {
    name: 'High Sensitivity',
    description: 'Detect dimmer LEDs and ambient lighting',
    config: {
      threshold: 0.5,
      sensitivity: 1.5,
      minArea: 1,
      maxArea: 100
    }
  },
  {
    name: 'Precise',
    description: 'Only detect very bright, clear LEDs',
    config: {
      threshold: 0.85,
      sensitivity: 0.8,
      minArea: 2,
      maxArea: 30
    }
  },
  {
    name: 'Poi/Staff',
    description: 'Optimized for poi and staff props',
    config: {
      threshold: 0.75,
      sensitivity: 1.2,
      minArea: 3,
      maxArea: 40
    }
  },
  {
    name: 'Fans',
    description: 'Optimized for LED fans',
    config: {
      threshold: 0.6,
      sensitivity: 1.1,
      minArea: 1,
      maxArea: 80
    }
  }
];

export enum LedDetectionMode {
  BRIGHTNESS_THRESHOLD = 'brightness_threshold',
  COLOR_DETECTION = 'color_detection',
  MOTION_DETECTION = 'motion_detection',
  HYBRID = 'hybrid'
}

export interface LedDetectionMetrics {
  /** Detection mode used */
  mode: LedDetectionMode;
  
  /** Performance metrics */
  performance: {
    averageProcessingTime: number;
    minProcessingTime: number;
    maxProcessingTime: number;
    frameRate: number;
  };
  
  /** Quality metrics */
  quality: {
    detectionRate: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
  };
}
