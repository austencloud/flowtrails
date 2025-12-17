<script lang="ts">
  let {
    isPlaying = false,
    currentTime = 0,
    duration = 0,
    onTogglePlay,
    onSeek
  } = $props<{
    isPlaying?: boolean;
    currentTime?: number;
    duration?: number;
    onTogglePlay?: () => void;
    onSeek?: (time: number) => void;
  }>();

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function handleSeek(e: Event) {
    const value = Number((e.target as HTMLInputElement)?.value || 0);
    onSeek?.(value);
  }
</script>

<div class="video-controls">
  <div class="control-bar">
    <button class="play-btn" onclick={onTogglePlay}>
      {isPlaying ? '⏸️' : '▶️'}
    </button>

    <div class="timeline-container">
      <input
        type="range"
        class="timeline"
        min="0"
        max={duration || 0}
        value={currentTime}
        oninput={handleSeek}
      />
      <div class="time-display">
        <span class="current-time">{formatTime(currentTime)}</span>
        <span class="duration">{formatTime(duration)}</span>
      </div>
    </div>
  </div>
</div>

<style>
  .video-controls {
    margin-top: 1rem;
    background: rgba(20, 20, 20, 0.9);
    border: 1px solid #333;
    border-radius: 8px;
    padding: 1rem;
    backdrop-filter: blur(10px);
  }

  .control-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .play-btn {
    background: rgba(0, 212, 255, 0.2);
    border: 1px solid #00d4ff;
    border-radius: 50%;
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.2rem;
    color: #00d4ff;
    transition: all 0.2s;
  }

  .play-btn:hover {
    background: rgba(0, 212, 255, 0.3);
    transform: scale(1.05);
  }

  .timeline-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .timeline {
    width: 100%;
    height: var(--touch-target-min);
    background: transparent;
    outline: none;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
  }

  .timeline::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    background: #333;
    border-radius: 3px;
  }

  .timeline::-moz-range-track {
    width: 100%;
    height: 6px;
    background: #333;
    border-radius: 3px;
  }

  .timeline::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: var(--slider-thumb-size-lg);
    height: var(--slider-thumb-size-lg);
    background: var(--color-primary);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    margin-top: -11px;
  }

  .timeline::-moz-range-thumb {
    width: var(--slider-thumb-size-lg);
    height: var(--slider-thumb-size-lg);
    background: var(--color-primary);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
  }

  .time-display {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: #aaa;
    font-family: monospace;
  }

  .current-time { color: #00d4ff; }
  .duration { color: #888; }
</style>
