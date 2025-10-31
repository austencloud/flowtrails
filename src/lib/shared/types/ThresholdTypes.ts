/**
 * Threshold detection types for LED tracking
 */

export type ThresholdType = 'color' | 'brightness';

export interface ColorThreshold {
  type: 'color';
  targetColor: {
    r: number;
    g: number;  
    b: number;
  };
  tolerance: number; // 0-100
  hueRange?: number; // Optional HSV hue range
  saturationMin?: number; // Minimum saturation (0-100)
}

export interface BrightnessThreshold {
  type: 'brightness';
  minBrightness: number; // 0-255
  maxBrightness: number; // 0-255
  contrast?: number; // Optional contrast boost
}

export type DetectionThreshold = ColorThreshold | BrightnessThreshold;

export interface ThresholdDetectionResult {
  mask: ImageData; // Binary mask of detected pixels
  detectedPixels: Array<{
    x: number;
    y: number;
    confidence: number; // 0-1
  }>;
  coverage: number; // Percentage of frame covered (0-1)
  centerPoint?: {
    x: number;
    y: number;
  };
}

export interface DetectionSettings {
  threshold: DetectionThreshold;
  morphology?: {
    erosion: number; // Remove noise
    dilation: number; // Fill gaps
  };
  minArea?: number; // Minimum pixel area to consider
  maxArea?: number; // Maximum pixel area to consider
  enableTracking?: boolean; // Track movement between frames
}

export interface FrameAnalysis {
  timestamp: number;
  frameData: ImageData;
  detectionResult: ThresholdDetectionResult;
  processingTimeMs: number;
}
