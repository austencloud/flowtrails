<script lang="ts">
  import '../app'; // Initialize DI container
  import { VideoUploader } from '$video';
  import LedDetectionVisualizer from '$effects/components/LedDetectionVisualizer.svelte';
  import { createAppState } from '$shared/state/app-state.svelte';
  import { VideoSyncService } from '$video/services/VideoSyncService';

  // Create unified app state (single source of truth)
  const appState = createAppState();
  const { video, pipeline, effects } = appState;

  // Video sync service
  const videoSyncService = new VideoSyncService();

  // Local UI state
  let processedVideo: HTMLVideoElement;
  let isPlaying = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);

  // Preload test video on mount
  $effect(() => {
    if (typeof window !== 'undefined') {
      preloadTestVideo();
    }
  });

  // Set up video synchronization when both videos are ready
  $effect(() => {
    if (video.currentVideo?.element && processedVideo) {
      const cleanup = videoSyncService.sync({
        sourceVideo: video.currentVideo.element,
        targetVideo: processedVideo,
        onStateChange: (state) => {
          isPlaying = state.isPlaying;
          currentTime = state.currentTime;
          duration = state.duration;
        }
      });

      // Cleanup on state change
      return cleanup;
    }
  });

  async function preloadTestVideo() {
    try {
      const response = await fetch('/test-videos/NPNP-lambda.mp4');
      const blob = await response.blob();
      const file = new File([blob], 'NPNP-lambda.mp4', { type: 'video/mp4' });
      await video.loadVideo(file);
      console.log('✅ Test video preloaded');
    } catch (error) {
      console.warn('Could not preload test video:', error);
    }
  }

  function handleVideoLoaded(file: File) {
    video.loadVideo(file);
  }

  function togglePlayPause() {
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  }

  function seekTo(time: number) {
    video.seek(time);
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
</script>

<main>
  <!-- Header -->
  <header class="app-header">
    <h1>FlowTrails</h1>
    <div class="header-controls">
      <VideoUploader onVideoLoaded={handleVideoLoaded} compact={true} />
    </div>
  </header>

  <!-- Main Content -->
  <div class="main-content">
    <!-- Video Processing Area -->
    <section class="video-workspace">
      <div class="video-panels">
        <!-- Original Video -->
        <div class="video-panel">
          <div class="panel-header">
            <h3>Original</h3>
            <div class="video-info">
              {#if video.currentVideo}
                <span class="duration">{Math.round(video.currentVideo.metadata.duration)}s</span>
                <span class="resolution">{video.currentVideo.metadata.width}×{video.currentVideo.metadata.height}</span>
              {/if}
            </div>
          </div>
          <div class="video-container">
            {#if video.currentVideo}
              <video
                bind:this={video.currentVideo.element}
                class="main-video"
                muted
              >
                <source src={video.currentVideo.url} type="video/{video.currentVideo.metadata.format}">
                Your browser does not support the video tag.
              </video>
            {:else}
              <div class="video-placeholder">
                <div class="placeholder-content">
                  <div class="placeholder-icon">📹</div>
                  <p>Loading video...</p>
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- Processed Video -->
        <div class="video-panel">
          <div class="panel-header">
            <h3>Processed</h3>
            <div class="video-info">
              <span class="status">Synchronized playback</span>
            </div>
          </div>
          <div class="video-container">
            {#if video.currentVideo}
              <video
                bind:this={processedVideo}
                class="main-video"
                muted
              >
                <source src={video.currentVideo.url} type="video/{video.currentVideo.metadata.format}">
                Your browser does not support the video tag.
              </video>
            {:else}
              <div class="video-placeholder processed">
                {#if video.currentVideo}
                  <!-- LED Detection Visualizer -->
                  <LedDetectionVisualizer
                    videoElement={video.currentVideo?.element || null}
                    width={400}
                    height={300}
                    showOverlay={true}
                    showStats={true}
                  />
                {:else}
                  <div class="placeholder-content">
                    <div class="placeholder-icon">✨</div>
                    <p>Effects preview</p>
                    <small>Real-time processing will appear here</small>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Custom Video Controls -->
      {#if video.currentVideo}
        <div class="video-controls">
          <div class="control-bar">
            <button class="play-btn" onclick={togglePlayPause}>
              {isPlaying ? '⏸️' : '▶️'}
            </button>

            <div class="timeline-container">
              <input
                type="range"
                class="timeline"
                min="0"
                max={duration || 0}
                value={currentTime}
                oninput={(e) => seekTo(Number((e.target as HTMLInputElement)?.value || 0))}
              />
              <div class="time-display">
                <span class="current-time">{formatTime(currentTime)}</span>
                <span class="duration">{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </section>

    <!-- Controls Panel -->
    <section class="controls-panel">

      <div class="effect-controls">
        <h3>Effect Pipeline</h3>
        <div class="control-groups">
          <div class="control-group">
            <h4>🎯 LED Detection</h4>
            <div class="controls">
              <label>
                Threshold: <input
                  type="range"
                  min="0"
                  max="100"
                  value={effects.ledThreshold * 100}
                  oninput={(e) => effects.ledThreshold = Number((e.target as HTMLInputElement).value) / 100}
                />
              </label>
              <label>
                Sensitivity: <input
                  type="range"
                  min="0"
                  max="200"
                  value={effects.ledSensitivity * 100}
                  oninput={(e) => effects.ledSensitivity = Number((e.target as HTMLInputElement).value) / 100}
                />
              </label>
            </div>
          </div>

          <div class="control-group">
            <h4>✨ Trail Effects</h4>
            <div class="controls">
              <label>
                Length: <input
                  type="range"
                  min="0"
                  max="100"
                  value={effects.trailLength * 100}
                  oninput={(e) => effects.trailLength = Number((e.target as HTMLInputElement).value) / 100}
                />
              </label>
              <label>
                Fade: <input
                  type="range"
                  min="0"
                  max="100"
                  value={effects.trailFade * 100}
                  oninput={(e) => effects.trailFade = Number((e.target as HTMLInputElement).value) / 100}
                />
              </label>
            </div>
          </div>

          <div class="control-group">
            <h4>📹 Export</h4>
            <div class="controls">
              <button class="export-btn" disabled>Export Video</button>
              <button class="export-btn" disabled>Export GIF</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</main>

<style>
  /* Global Dark Theme */
  :global(body) {
    background: #0a0a0a;
    color: #e0e0e0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    padding: 0;
  }

  main {
    min-height: 100vh;
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .app-header {
    background: rgba(20, 20, 20, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid #333;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .app-header h1 {
    color: #00d4ff;
    font-size: 1.8rem;
    font-weight: 600;
    margin: 0;
    text-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  /* Main Content */
  .main-content {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 2rem;
    padding: 2rem;
    max-height: calc(100vh - 80px);
    overflow: hidden;
  }

  /* Video Workspace */
  .video-workspace {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .video-panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    flex: 1;
  }

  .video-panel {
    background: rgba(30, 30, 30, 0.8);
    border: 1px solid #444;
    border-radius: 12px;
    overflow: hidden;
    backdrop-filter: blur(10px);
  }

  .panel-header {
    background: rgba(40, 40, 40, 0.9);
    padding: 1rem;
    border-bottom: 1px solid #555;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .panel-header h3 {
    color: #fff;
    margin: 0;
    font-size: 1.1rem;
    font-weight: 500;
  }

  .video-info {
    display: flex;
    gap: 1rem;
    font-size: 0.85rem;
    color: #aaa;
  }

  .video-info .duration {
    color: #00d4ff;
  }

  .video-info .resolution {
    color: #4ade80;
  }

  .video-info .status {
    color: #fbbf24;
  }

  .video-container {
    aspect-ratio: 1;
    position: relative;
    background: #000;
  }

  .main-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }

  .video-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(45deg, #1a1a1a, #2a2a2a);
    border: 2px dashed #444;
  }

  .video-placeholder.processed {
    background: linear-gradient(45deg, #1a1a2a, #2a2a3a);
    border-color: #4ade80;
  }

  .placeholder-content {
    text-align: center;
    color: #666;
  }

  .placeholder-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .placeholder-content p {
    margin: 0.5rem 0;
    font-size: 1.1rem;
  }

  .placeholder-content small {
    font-size: 0.85rem;
    color: #888;
  }

  /* Controls Panel */
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

  /* Video Controls */
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
    height: 6px;
    background: #333;
    border-radius: 3px;
    outline: none;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
  }

  .timeline::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background: #00d4ff;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
  }

  .timeline::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: #00d4ff;
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

  .current-time {
    color: #00d4ff;
  }

  .duration {
    color: #888;
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
    margin-left: 1rem;
  }

  .controls input[type="range"]:disabled {
    opacity: 0.5;
  }

  .export-btn {
    background: linear-gradient(135deg, #4ade80, #22c55e);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
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

  /* Responsive Design */
  @media (max-width: 1200px) {
    .main-content {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr auto;
    }

    .controls-panel {
      max-height: 300px;
    }
  }

  @media (max-width: 768px) {
    .video-panels {
      grid-template-columns: 1fr;
    }

    .app-header {
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }

    .main-content {
      padding: 1rem;
    }
  }
</style>
