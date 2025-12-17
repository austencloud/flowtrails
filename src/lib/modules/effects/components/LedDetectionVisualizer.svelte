<script lang="ts">
  import { createEffectsState } from '../state/effects-state.svelte';
  import { resolve, TYPES } from '$shared';
  import type { ILedDetectionService } from '../led-detection/services/contracts/ILedDetectionService';

  // Props
  let { 
    videoElement = null,
    width = 400,
    height = 300,
    showOverlay = true,
    showStats = true
  } = $props<{
    videoElement: HTMLVideoElement | null;
    width?: number;
    height?: number;
    showOverlay?: boolean;
    showStats?: boolean;
  }>();

  // Canvas elements
  let canvas = $state<HTMLCanvasElement>();
  let overlayCanvas = $state<HTMLCanvasElement>();
  let ctx: CanvasRenderingContext2D;
  let overlayCtx: CanvasRenderingContext2D;

  // Services and state
  const effectsState = createEffectsState();
  const ledService = resolve(TYPES.ILedDetectionService) as ILedDetectionService;

  // Detection state
  let isProcessing = $state(false);
  let detectionStats = $state({
    detectedPixels: 0,
    processingTime: 0,
    fps: 0,
    lastUpdate: 0
  });

  // Initialize canvases
  $effect(() => {
    if (canvas && overlayCanvas) {
      ctx = canvas.getContext('2d')!;
      overlayCtx = overlayCanvas.getContext('2d')!;

      // Set canvas sizes
      canvas.width = width;
      canvas.height = height;
      overlayCanvas.width = width;
      overlayCanvas.height = height;

      console.log('✅ LED Detection Visualizer initialized', { width, height });
      console.log('📊 Current threshold:', effectsState.ledThreshold);
      console.log('📊 Current sensitivity:', effectsState.ledSensitivity);
    }
  });

  // Process video frame for LED detection
  async function processFrame() {
    if (!videoElement || !ctx || !overlayCtx || isProcessing) return;
    
    isProcessing = true;
    const startTime = performance.now();
    
    try {
      // Draw current video frame to canvas
      ctx.drawImage(videoElement, 0, 0, width, height);
      
      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;
      
      // Simple CPU-based threshold detection for testing
      const threshold = effectsState.ledThreshold;
      const sensitivity = effectsState.ledSensitivity;
      
      let detectedCount = 0;
      const detectedPixels: Array<{x: number, y: number, brightness: number}> = [];
      
      // Clear overlay
      overlayCtx.clearRect(0, 0, width, height);
      
      // Process pixels
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        // Calculate luminance (brightness)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const adjustedLuminance = luminance * sensitivity;
        
        // Check if above threshold
        if (adjustedLuminance >= threshold) {
          const pixelIndex = i / 4;
          const x = pixelIndex % width;
          const y = Math.floor(pixelIndex / width);
          
          detectedPixels.push({ x, y, brightness: luminance });
          detectedCount++;
          
          // Draw detection overlay (red dot)
          if (showOverlay) {
            overlayCtx.fillStyle = `rgba(255, 0, 0, ${Math.min(adjustedLuminance, 1)})`;
            overlayCtx.fillRect(x, y, 2, 2);
          }
        }
      }
      
      // Update stats
      const processingTime = performance.now() - startTime;
      const now = performance.now();
      const deltaTime = now - detectionStats.lastUpdate;
      const fps = deltaTime > 0 ? 1000 / deltaTime : 0;
      
      detectionStats = {
        detectedPixels: detectedCount,
        processingTime,
        fps: Math.round(fps * 10) / 10,
        lastUpdate: now
      };
      
    } catch (error) {
      console.error('❌ LED detection processing error:', error);
    } finally {
      isProcessing = false;
    }
  }

  // Auto-process frames when video is playing
  let animationFrame: number;
  
  $effect(() => {
    if (videoElement && !videoElement.paused) {
      const animate = () => {
        processFrame();
        animationFrame = requestAnimationFrame(animate);
      };
      animate();
      
      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }
  });

  // Manual processing trigger
  function triggerDetection() {
    processFrame();
  }

  // Test pattern generator
  function generateTestPattern() {
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Draw bright test spots
    const spots = [
      { x: 50, y: 50, brightness: 255 },   // Very bright
      { x: 150, y: 50, brightness: 200 },  // Bright
      { x: 250, y: 50, brightness: 150 },  // Medium
      { x: 350, y: 50, brightness: 100 },  // Dim
      { x: 50, y: 150, brightness: 80 },   // Very dim
    ];

    spots.forEach(spot => {
      ctx.fillStyle = `rgb(${spot.brightness}, ${spot.brightness}, ${spot.brightness})`;
      ctx.fillRect(spot.x - 10, spot.y - 10, 20, 20);

      // Add colored spots too
      ctx.fillStyle = `rgb(${spot.brightness}, 0, 0)`; // Red
      ctx.fillRect(spot.x - 5, spot.y + 30, 10, 10);

      ctx.fillStyle = `rgb(0, ${spot.brightness}, 0)`; // Green
      ctx.fillRect(spot.x - 5, spot.y + 50, 10, 10);

      ctx.fillStyle = `rgb(0, 0, ${spot.brightness})`; // Blue
      ctx.fillRect(spot.x - 5, spot.y + 70, 10, 10);
    });

    console.log('🎨 Test pattern generated');

    // Trigger detection on test pattern
    setTimeout(() => processFrame(), 100);
  }
</script>

<div class="led-visualizer">
  <div class="canvas-container">
    <!-- Video frame canvas -->
    <canvas 
      bind:this={canvas}
      class="video-canvas"
      style="width: {width}px; height: {height}px;"
    ></canvas>
    
    <!-- Detection overlay canvas -->
    {#if showOverlay}
      <canvas 
        bind:this={overlayCanvas}
        class="overlay-canvas"
        style="width: {width}px; height: {height}px;"
      ></canvas>
    {/if}
  </div>
  
  {#if showStats}
    <div class="detection-stats">
      <h4>🎯 LED Detection Stats</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="label">Detected Pixels:</span>
          <span class="value">{detectionStats.detectedPixels.toLocaleString()}</span>
        </div>
        <div class="stat-item">
          <span class="label">Processing Time:</span>
          <span class="value">{detectionStats.processingTime.toFixed(1)}ms</span>
        </div>
        <div class="stat-item">
          <span class="label">FPS:</span>
          <span class="value">{detectionStats.fps}</span>
        </div>
        <div class="stat-item">
          <span class="label">Threshold:</span>
          <span class="value">{Math.round(effectsState.ledThreshold * 100)}%</span>
        </div>
        <div class="stat-item">
          <span class="label">Sensitivity:</span>
          <span class="value">{Math.round(effectsState.ledSensitivity * 100)}%</span>
        </div>
      </div>
      
      <div class="controls">
        <button onclick={triggerDetection} class="detect-btn">
          🔍 Detect Now
        </button>
        <button onclick={generateTestPattern} class="test-btn">
          🎨 Test Pattern
        </button>
        <label class="overlay-toggle">
          <input type="checkbox" bind:checked={showOverlay} />
          Show Overlay
        </label>
      </div>
    </div>
  {/if}
</div>

<style>
  .led-visualizer {
    background: rgba(20, 20, 20, 0.9);
    border: 1px solid #333;
    border-radius: 8px;
    padding: 1rem;
    backdrop-filter: blur(10px);
  }

  .canvas-container {
    position: relative;
    display: inline-block;
    border: 1px solid #444;
    border-radius: 4px;
    overflow: hidden;
  }

  .video-canvas {
    display: block;
    background: #000;
  }

  .overlay-canvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    mix-blend-mode: screen;
  }

  .detection-stats {
    margin-top: 1rem;
  }

  .detection-stats h4 {
    color: #00d4ff;
    margin: 0 0 1rem 0;
    font-size: 1rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 0;
    font-size: 0.85rem;
  }

  .stat-item .label {
    color: #aaa;
  }

  .stat-item .value {
    color: #00d4ff;
    font-weight: 500;
    font-family: monospace;
  }

  .controls {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .detect-btn, .test-btn {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
    color: white;
    border: none;
    padding: 0.75rem 1.25rem;
    min-height: var(--touch-target-min);
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
    cursor: pointer;
    transition: var(--transition-fast);
  }

  .test-btn {
    background: linear-gradient(135deg, var(--color-warning), #cc5500);
  }

  .detect-btn:hover, .test-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
  }

  .test-btn:hover {
    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
  }

  .overlay-toggle {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--color-text-muted);
    font-size: 0.85rem;
    cursor: pointer;
    min-height: var(--touch-target-min);
    padding: 0.5rem 0.75rem;
  }

  .overlay-toggle input {
    accent-color: var(--color-primary);
    width: var(--checkbox-size);
    height: var(--checkbox-size);
    min-width: var(--checkbox-size);
    min-height: var(--checkbox-size);
    cursor: pointer;
  }
</style>
