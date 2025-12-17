<script lang="ts">
  import { createTrailProcessor, type TrailProcessor, type TrailConfig, type FrameStats } from '$effects/trail-effects/services/implementations/TrailProcessor';

  let {
    title = 'Processed',
    sourceVideo,
    config,
    onStats,
    canvasRef = $bindable<HTMLCanvasElement | undefined>(undefined),
    processorRef = $bindable<TrailProcessor | null>(null)
  } = $props<{
    title?: string;
    sourceVideo: HTMLVideoElement | undefined;
    config: TrailConfig;
    onStats?: (stats: FrameStats) => void;
    canvasRef?: HTMLCanvasElement | undefined;
    processorRef?: TrailProcessor | null;
  }>();

  let canvas: HTMLCanvasElement | undefined = $state();
  let processor: TrailProcessor | null = $state(null);
  let stats: FrameStats | null = $state(null);
  let videoReady = $state(false);

  // Sync refs with internal state
  $effect(() => {
    canvasRef = canvas;
  });

  $effect(() => {
    processorRef = processor;
  });

  // Watch for video ready state
  $effect(() => {
    if (!sourceVideo) {
      console.log('🎬 ProcessedVideoPanel: No source video yet');
      videoReady = false;
      return;
    }

    console.log('🎬 ProcessedVideoPanel: Source video received, readyState:', sourceVideo.readyState, 'src:', sourceVideo.src?.substring(0, 50));

    // Check if already ready
    if (sourceVideo.readyState >= 2) {
      console.log('🎬 ProcessedVideoPanel: Video already ready!');
      videoReady = true;
      return;
    }

    // Listen for ready events
    const handleReady = () => {
      console.log('🎬 ProcessedVideoPanel: Video ready event fired, readyState:', sourceVideo.readyState);
      if (sourceVideo.readyState >= 2) {
        videoReady = true;
      }
    };

    sourceVideo.addEventListener('canplay', handleReady);
    sourceVideo.addEventListener('loadeddata', handleReady);
    sourceVideo.addEventListener('loadedmetadata', handleReady);

    // Polling fallback in case we missed the events
    const pollInterval = setInterval(() => {
      if (sourceVideo.readyState >= 2 && !videoReady) {
        console.log('🎬 ProcessedVideoPanel: Video ready via polling');
        videoReady = true;
        clearInterval(pollInterval);
      }
    }, 100);

    return () => {
      sourceVideo.removeEventListener('canplay', handleReady);
      sourceVideo.removeEventListener('loadeddata', handleReady);
      sourceVideo.removeEventListener('loadedmetadata', handleReady);
      clearInterval(pollInterval);
    };
  });

  // Initialize processor when canvas and video are ready
  // Use $effect.root or track only the essential dependencies
  $effect(() => {
    // Only track these specific dependencies for initialization
    const canvasReady = !!canvas;
    const videoRef = sourceVideo;
    const isVideoReady = videoReady;

    if (!canvasReady || !videoRef || !isVideoReady) {
      return;
    }

    // Don't re-run if we already have a processor for this video
    if (processor) {
      return;
    }

    console.log('🎬 Initializing trail processor...', {
      videoWidth: videoRef.videoWidth,
      videoHeight: videoRef.videoHeight
    });

    try {
      // Create new processor with current config snapshot
      const currentConfig = { ...config };
      processor = createTrailProcessor({
        sourceVideo: videoRef,
        outputCanvas: canvas!,
        config: currentConfig,
        onFrame: (frameStats) => {
          stats = frameStats;
          onStats?.(frameStats);
        }
      });

      // Start if video is playing
      if (!videoRef.paused) {
        processor.start();
      }
    } catch (err) {
      console.error('❌ Failed to create TrailProcessor:', err);
    }
  });

  // Cleanup on unmount
  $effect(() => {
    return () => {
      processor?.dispose();
      processor = null;
    };
  });

  // Start/stop based on video playback state
  $effect(() => {
    if (!processor || !sourceVideo) return;

    const handlePlay = () => {
      console.log('▶️ Starting trail processor');
      processor?.start();
    };
    const handlePause = () => {
      console.log('⏸️ Stopping trail processor');
      processor?.stop();
    };
    const handleSeeked = () => processor?.clearTrails();

    sourceVideo.addEventListener('play', handlePlay);
    sourceVideo.addEventListener('pause', handlePause);
    sourceVideo.addEventListener('seeked', handleSeeked);

    // Start if already playing
    if (!sourceVideo.paused) {
      processor.start();
    }

    return () => {
      sourceVideo.removeEventListener('play', handlePlay);
      sourceVideo.removeEventListener('pause', handlePause);
      sourceVideo.removeEventListener('seeked', handleSeeked);
    };
  });

  // Update config when it changes
  $effect(() => {
    if (processor) {
      processor.updateConfig(config);
    }
  });
</script>

<div class="video-panel processed">
  <div class="panel-header">
    <h3>{title}</h3>
    <div class="video-info">
      {#if stats}
        <span class="fps">{stats.fps} FPS</span>
        <span class="points">{stats.detectedPoints} LEDs</span>
      {:else if processor}
        <span class="status">Ready - press play</span>
      {:else if videoReady}
        <span class="status">Initializing...</span>
      {:else if sourceVideo}
        <span class="status">Loading video...</span>
      {:else}
        <span class="status">No video</span>
      {/if}
    </div>
  </div>
  <div class="video-container">
    <canvas
      bind:this={canvas}
      class="processed-canvas"
    ></canvas>
    {#if !sourceVideo || !videoReady}
      <div class="video-placeholder">
        <div class="placeholder-content">
          <div class="placeholder-icon">✨</div>
          <p>{sourceVideo ? 'Loading video...' : 'Effects preview'}</p>
          <small>{sourceVideo ? 'Waiting for video data' : 'Real-time processing will appear here'}</small>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .video-panel {
    background: rgba(30, 30, 30, 0.8);
    border: 1px solid #444;
    border-radius: 12px;
    overflow: hidden;
    backdrop-filter: blur(10px);
  }

  .video-panel.processed {
    border-color: #4ade80;
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

  .video-info .fps { color: #00d4ff; }
  .video-info .points { color: #4ade80; }
  .video-info .status { color: #fbbf24; }

  .video-container {
    aspect-ratio: 1;
    position: relative;
    background: #000;
  }

  .processed-canvas {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }

  .video-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(45deg, #1a1a2a, #2a2a3a);
    border: 2px dashed #4ade80;
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
</style>
