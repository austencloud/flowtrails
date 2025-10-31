/**
 * LED Detection Algorithm Tests
 * Tests the core brightness threshold detection logic
 */

import { describe, it, expect } from 'vitest';

// Test the core LED detection algorithm
describe('LED Detection Algorithm', () => {
  
  // Helper function to calculate luminance (same as in visualizer)
  function calculateLuminance(r: number, g: number, b: number): number {
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  // Helper function to detect brightness (same as in visualizer)
  function detectBrightness(r: number, g: number, b: number, threshold: number, sensitivity: number): boolean {
    const luminance = calculateLuminance(r, g, b);
    const adjustedLuminance = luminance * sensitivity;
    return adjustedLuminance >= threshold;
  }

  describe('Luminance Calculation', () => {
    it('should calculate correct luminance for pure white', () => {
      const luminance = calculateLuminance(255, 255, 255);
      expect(luminance).toBe(1.0);
    });

    it('should calculate correct luminance for pure black', () => {
      const luminance = calculateLuminance(0, 0, 0);
      expect(luminance).toBe(0.0);
    });

    it('should calculate correct luminance for pure red', () => {
      const luminance = calculateLuminance(255, 0, 0);
      expect(luminance).toBeCloseTo(0.299, 3);
    });

    it('should calculate correct luminance for pure green', () => {
      const luminance = calculateLuminance(0, 255, 0);
      expect(luminance).toBeCloseTo(0.587, 3);
    });

    it('should calculate correct luminance for pure blue', () => {
      const luminance = calculateLuminance(0, 0, 255);
      expect(luminance).toBeCloseTo(0.114, 3);
    });

    it('should calculate correct luminance for gray', () => {
      const luminance = calculateLuminance(128, 128, 128);
      expect(luminance).toBeCloseTo(0.502, 3);
    });
  });

  describe('Brightness Detection', () => {
    const threshold = 0.7; // 70% threshold
    const sensitivity = 1.0; // Normal sensitivity

    it('should detect bright white pixels', () => {
      const detected = detectBrightness(255, 255, 255, threshold, sensitivity);
      expect(detected).toBe(true);
    });

    it('should not detect dark pixels', () => {
      const detected = detectBrightness(50, 50, 50, threshold, sensitivity);
      expect(detected).toBe(false);
    });

    it('should detect pixels at exact threshold', () => {
      // Calculate RGB values that give exactly 70% luminance
      const targetLuminance = 0.7;
      const grayValue = Math.round(targetLuminance * 255);
      const detected = detectBrightness(grayValue, grayValue, grayValue, threshold, sensitivity);
      expect(detected).toBe(true);
    });

    it('should not detect pixels just below threshold', () => {
      const targetLuminance = 0.69; // Just below 70%
      const grayValue = Math.round(targetLuminance * 255);
      const detected = detectBrightness(grayValue, grayValue, grayValue, threshold, sensitivity);
      expect(detected).toBe(false);
    });

    it('should respect sensitivity adjustments', () => {
      const highSensitivity = 2.0;
      const lowSensitivity = 0.5;
      
      // Medium brightness pixel
      const r = 128, g = 128, b = 128;
      
      const detectedHigh = detectBrightness(r, g, b, threshold, highSensitivity);
      const detectedLow = detectBrightness(r, g, b, threshold, lowSensitivity);
      
      expect(detectedHigh).toBe(true);  // High sensitivity should detect
      expect(detectedLow).toBe(false);  // Low sensitivity should not detect
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero threshold', () => {
      const detected = detectBrightness(1, 1, 1, 0, 1);
      expect(detected).toBe(true);
    });

    it('should handle maximum threshold', () => {
      const detected = detectBrightness(254, 254, 254, 1.0, 1);
      expect(detected).toBe(false);
    });

    it('should handle zero sensitivity', () => {
      const detected = detectBrightness(255, 255, 255, 0.5, 0);
      expect(detected).toBe(false);
    });

    it('should handle very high sensitivity', () => {
      const detected = detectBrightness(10, 10, 10, 0.5, 100);
      expect(detected).toBe(true);
    });
  });

  describe('Real-world LED Colors', () => {
    const threshold = 0.5; // Lower threshold for LED detection
    const sensitivity = 1.0;

    it('should detect bright LED colors', () => {
      // Common LED colors
      const brightRed = detectBrightness(255, 0, 0, threshold, sensitivity);
      const brightGreen = detectBrightness(0, 255, 0, threshold, sensitivity);
      const brightBlue = detectBrightness(0, 0, 255, threshold, sensitivity);
      const brightWhite = detectBrightness(255, 255, 255, threshold, sensitivity);

      expect(brightRed).toBe(false); // Red alone might not be bright enough (0.299)
      expect(brightGreen).toBe(true); // Green has high luminance weight (0.587)
      expect(brightBlue).toBe(false); // Blue has low luminance weight (0.114)
      expect(brightWhite).toBe(true); // White should always be detected
    });

    it('should detect typical poi LED colors', () => {
      // Typical poi/flow art LED colors
      const warmWhite = detectBrightness(255, 240, 200, threshold, sensitivity);
      const coolWhite = detectBrightness(200, 220, 255, threshold, sensitivity);
      const amber = detectBrightness(255, 191, 0, threshold, sensitivity);
      
      expect(warmWhite).toBe(true);
      expect(coolWhite).toBe(true);
      expect(amber).toBe(true);
    });
  });
});

// Performance test helper
export function createTestImageData(width: number, height: number, pattern: 'random' | 'gradient' | 'spots'): ImageData {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = width;
  canvas.height = height;
  
  switch (pattern) {
    case 'random':
      // Random noise pattern
      for (let i = 0; i < width * height; i++) {
        const x = i % width;
        const y = Math.floor(i / width);
        const brightness = Math.random() * 255;
        ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
        ctx.fillRect(x, y, 1, 1);
      }
      break;
      
    case 'gradient':
      // Horizontal brightness gradient
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'black');
      gradient.addColorStop(1, 'white');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      break;
      
    case 'spots':
      // Black background with bright spots
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);
      
      // Add random bright spots
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const brightness = 200 + Math.random() * 55;
        ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
      break;
  }
  
  return ctx.getImageData(0, 0, width, height);
}
