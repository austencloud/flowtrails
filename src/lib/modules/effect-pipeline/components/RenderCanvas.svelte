<script lang="ts">
  import { createPipelineState } from '../state/pipeline-state.svelte';
  import { onMount, onDestroy } from 'svelte';
  
  // Props
  let { 
    width = 800,
    height = 600,
    autoInitialize = true,
    preferredBackend = 'webgpu' as const
  } = $props();

  // State
  const pipelineState = createPipelineState();
  let canvas: HTMLCanvasElement;
  let mounted = $state(false);

  // Initialize pipeline when component mounts
  onMount(async () => {
    mounted = true;
    
    if (autoInitialize && canvas) {
      canvas.width = width;
      canvas.height = height;
      
      await pipelineState.initializePipeline(canvas, {
        preferredBackend,
        width,
        height
      });
    }
  });

  // Cleanup on destroy
  onDestroy(() => {
    pipelineState.destroyPipeline();
    pipelineState.cleanup();
  });

  // Reactive resize
  $effect(() => {
    if (mounted && canvas && pipelineState.initialized) {
      canvas.width = width;
      canvas.height = height;
      pipelineState.resizePipeline(width, height);
    }
  });

  // Manual initialization function
  async function initializePipeline() {
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
      await pipelineState.initializePipeline(canvas, {
        preferredBackend,
        width,
        height
      });
    }
  }

  // Format capabilities for display
  function formatCapabilities() {
    const caps = pipelineState.capabilities;
    if (!caps) return 'Unknown';
    
    return [
      `Max Resolution: ${caps.maxResolution.width}×${caps.maxResolution.height}`,
      `Max FPS: ${caps.maxFPS}`,
      `WebGPU: ${caps.supportsWebGPU ? '✅' : '❌'}`,
      `WebGL2: ${caps.supportsWebGL2 ? '✅' : '❌'}`,
      `Float Textures: ${caps.supportsFloatTextures ? '✅' : '❌'}`,
      `Memory Limit: ${caps.memoryLimit}MB`
    ].join(' | ');
  }
</script>

<div class="render-canvas-container">
  <!-- Pipeline Status -->
  <div class="pipeline-status">
    <div class="status-row">
      <span class="label">Status:</span>
      <span class="value" class:loading={pipelineState.loading} class:error={pipelineState.error}>
        {#if pipelineState.loading}
          🔄 Initializing...
        {:else if pipelineState.error}
          ❌ {pipelineState.error}
        {:else if pipelineState.initialized}
          ✅ Ready ({pipelineState.backend?.toUpperCase()})
        {:else}
          ⏸️ Not initialized
        {/if}
      </span>
    </div>
    
    {#if pipelineState.capabilities}
      <div class="capabilities">
        <span class="label">Capabilities:</span>
        <span class="value">{formatCapabilities()}</span>
      </div>
    {/if}
  </div>

  <!-- Canvas -->
  <div class="canvas-wrapper">
    <canvas 
      bind:this={canvas}
      {width}
      {height}
      class="render-canvas"
    ></canvas>
    
    {#if !pipelineState.initialized && !pipelineState.loading}
      <div class="canvas-overlay">
        <button onclick={initializePipeline} class="init-button">
          Initialize Rendering Pipeline
        </button>
      </div>
    {/if}
  </div>

  <!-- Performance Info -->
  {#if pipelineState.initialized}
    <div class="performance-info">
      <div class="info-item">
        <span class="label">Backend:</span>
        <span class="value">{pipelineState.backend?.toUpperCase()}</span>
      </div>
      <div class="info-item">
        <span class="label">High Performance:</span>
        <span class="value">{pipelineState.supportsHighPerformance ? '✅' : '❌'}</span>
      </div>
      <div class="info-item">
        <span class="label">Resolution:</span>
        <span class="value">{width}×{height}</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .render-canvas-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #f9f9f9;
  }

  .pipeline-status {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    background: white;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9rem;
  }

  .status-row, .capabilities {
    display: flex;
    gap: 0.5rem;
  }

  .label {
    font-weight: bold;
    color: #666;
    min-width: 100px;
  }

  .value {
    color: #333;
  }

  .value.loading {
    color: #007acc;
  }

  .value.error {
    color: #dc3545;
  }

  .canvas-wrapper {
    position: relative;
    display: inline-block;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .render-canvas {
    display: block;
    background: #000;
    border: none;
  }

  .canvas-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.7);
    color: white;
  }

  .init-button {
    padding: 1rem 2rem;
    background: #007acc;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .init-button:hover {
    background: #005a9e;
  }

  .performance-info {
    display: flex;
    gap: 2rem;
    padding: 0.75rem;
    background: white;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9rem;
  }

  .info-item {
    display: flex;
    gap: 0.5rem;
  }

  .info-item .label {
    min-width: auto;
  }
</style>
