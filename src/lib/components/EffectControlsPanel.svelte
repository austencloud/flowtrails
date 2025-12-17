<script lang="ts">
  import type { ExportProgress } from '$export';

  let {
    ledThreshold = 0.5,
    ledSensitivity = 1,
    trailLength = 0.5,
    trailFade = 0.5,
    onLedThresholdChange,
    onLedSensitivityChange,
    onTrailLengthChange,
    onTrailFadeChange,
    onExportVideo,
    onExportGif,
    exportDisabled = true,
    isExporting = false,
    exportProgress = null
  } = $props<{
    ledThreshold?: number;
    ledSensitivity?: number;
    trailLength?: number;
    trailFade?: number;
    onLedThresholdChange?: (value: number) => void;
    onLedSensitivityChange?: (value: number) => void;
    onTrailLengthChange?: (value: number) => void;
    onTrailFadeChange?: (value: number) => void;
    onExportVideo?: () => void;
    onExportGif?: () => void;
    exportDisabled?: boolean;
    isExporting?: boolean;
    exportProgress?: ExportProgress | null;
  }>();

  function handleSlider(handler: ((v: number) => void) | undefined, scale: number = 100) {
    return (e: Event) => {
      const value = Number((e.target as HTMLInputElement).value) / scale;
      handler?.(value);
    };
  }
</script>

<section class="controls-panel">
  <div class="effect-controls">
    <h3>Effect Pipeline</h3>
    <div class="control-groups">
      <!-- LED Detection -->
      <div class="control-group">
        <h4>🎯 LED Detection</h4>
        <div class="controls">
          <label>
            Threshold:
            <input
              type="range"
              min="0"
              max="100"
              value={ledThreshold * 100}
              oninput={handleSlider(onLedThresholdChange)}
            />
          </label>
          <label>
            Sensitivity:
            <input
              type="range"
              min="0"
              max="200"
              value={ledSensitivity * 100}
              oninput={handleSlider(onLedSensitivityChange)}
            />
          </label>
        </div>
      </div>

      <!-- Trail Effects -->
      <div class="control-group">
        <h4>✨ Trail Effects</h4>
        <div class="controls">
          <label>
            Length:
            <input
              type="range"
              min="0"
              max="100"
              value={trailLength * 100}
              oninput={handleSlider(onTrailLengthChange)}
            />
          </label>
          <label>
            Fade:
            <input
              type="range"
              min="0"
              max="100"
              value={trailFade * 100}
              oninput={handleSlider(onTrailFadeChange)}
            />
          </label>
        </div>
      </div>

      <!-- Export -->
      <div class="control-group">
        <h4>📹 Export</h4>
        <div class="controls">
          {#if isExporting && exportProgress}
            <div class="export-progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  style="width: {exportProgress.progress * 100}%"
                ></div>
              </div>
              <div class="progress-text">
                {exportProgress.message || `${Math.round(exportProgress.progress * 100)}%`}
              </div>
            </div>
          {:else}
            <button class="export-btn" disabled={exportDisabled} onclick={onExportVideo}>
              Export Video
            </button>
            <button class="export-btn secondary" disabled={exportDisabled} onclick={onExportGif}>
              Export GIF
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .controls-panel {
    background: rgba(20, 20, 20, 0.9);
    border: 1px solid #333;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    overflow-y: auto;
    backdrop-filter: blur(10px);
  }

  .effect-controls h3 {
    color: #fff;
    margin: 0 0 1.5rem 0;
    font-size: 1.2rem;
    font-weight: 500;
  }

  .control-groups {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .control-group {
    background: rgba(30, 30, 30, 0.6);
    border: 1px solid #444;
    border-radius: 8px;
    padding: 1.5rem;
  }

  .control-group h4 {
    color: #00d4ff;
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 500;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .controls label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #ccc;
    font-size: 0.9rem;
  }

  .controls input[type="range"] {
    width: 120px;
    height: var(--touch-target-min);
    margin-left: 1rem;
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }

  .controls input[type="range"]::-webkit-slider-runnable-track {
    height: 6px;
    background: #444;
    border-radius: 3px;
  }

  .controls input[type="range"]::-moz-range-track {
    height: 6px;
    background: #444;
    border-radius: 3px;
  }

  .controls input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: var(--slider-thumb-size);
    height: var(--slider-thumb-size);
    background: var(--color-primary);
    border-radius: 50%;
    margin-top: -9px;
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
  }

  .controls input[type="range"]::-moz-range-thumb {
    width: var(--slider-thumb-size);
    height: var(--slider-thumb-size);
    background: var(--color-primary);
    border-radius: 50%;
    border: none;
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
  }

  .controls input[type="range"]:disabled {
    opacity: 0.5;
  }

  .export-btn {
    background: linear-gradient(135deg, var(--color-success), var(--color-success-dark));
    color: white;
    border: none;
    padding: 0.875rem 1.5rem;
    min-height: var(--touch-target-min);
    border-radius: var(--radius-md);
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition-fast);
    margin-right: 0.5rem;
  }

  .export-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
  }

  .export-btn:disabled {
    background: #444;
    color: #888;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .export-btn.secondary {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  }

  .export-btn.secondary:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  }

  .export-progress {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: #333;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), var(--color-success));
    border-radius: 4px;
    transition: width 0.1s ease;
  }

  .progress-text {
    font-size: 0.85rem;
    color: var(--color-primary);
    text-align: center;
  }
</style>
