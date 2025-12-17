<script lang="ts">
  import '../app'; // Initialize DI container
  import { createAppState } from '$shared/state/app-state.svelte';
  import { AppHeader, VideoPanel, ProcessedVideoPanel, VideoControls, EffectControlsPanel } from '$lib/components';
  import { createVideoExportService, VideoExportService, type ExportProgress } from '$export';
  import type { TrailProcessor } from '$effects/trail-effects/services/implementations/TrailProcessor';

  // Create unified app state (single source of truth)
  const appState = createAppState();
  const { video, effects } = appState;

  // Export service
  const exportService = createVideoExportService();

  // Local UI state - video element reference
  let originalVideo: HTMLVideoElement | undefined = $state();
  let isPlaying = $state(false);
  let currentTime = $state(0);

  // Export state
  let processedCanvas: HTMLCanvasElement | undefined = $state();
  let trailProcessor: TrailProcessor | null = $state(null);
  let isExporting = $state(false);
  let exportProgress: ExportProgress | null = $state(null);

  // Duration from video metadata
  const duration = $derived(video.currentVideo?.metadata.duration || 0);

  // Can export when we have video and processor ready
  const canExport = $derived(!!video.currentVideo && !!processedCanvas && !!trailProcessor && !isExporting);

  // Trail effect config - reactive to effects state
  const trailConfig = $derived({
    ledThreshold: effects.ledThreshold,
    ledSensitivity: effects.ledSensitivity,
    trailLength: effects.trailLength,
    trailFade: effects.trailFade
  });

  // Preload test video on mount
  $effect(() => {
    if (typeof window !== 'undefined') {
      preloadTestVideo();
    }
  });

  // Track playback state from original video
  $effect(() => {
    if (!originalVideo) return;

    const updateState = () => {
      isPlaying = !originalVideo!.paused;
      currentTime = originalVideo!.currentTime;
    };

    originalVideo.addEventListener('play', updateState);
    originalVideo.addEventListener('pause', updateState);
    originalVideo.addEventListener('timeupdate', updateState);
    originalVideo.addEventListener('loadedmetadata', updateState);

    return () => {
      originalVideo!.removeEventListener('play', updateState);
      originalVideo!.removeEventListener('pause', updateState);
      originalVideo!.removeEventListener('timeupdate', updateState);
      originalVideo!.removeEventListener('loadedmetadata', updateState);
    };
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

  function handleVideoLoaded() {
    // Video is already loaded by VideoUploader via videoState.loadVideo
    // This callback is just for notification/side effects if needed
    console.log('📹 Video loaded via uploader');
  }

  function togglePlayPause() {
    if (!originalVideo) return;
    if (isPlaying) {
      originalVideo.pause();
    } else {
      originalVideo.play();
    }
  }

  function seekTo(time: number) {
    if (!originalVideo) return;
    originalVideo.currentTime = time;
  }

  async function handleExportVideo() {
    if (!canExport || !processedCanvas || !originalVideo) return;

    isExporting = true;
    exportProgress = { state: 'preparing', progress: 0, message: 'Preparing...' };

    try {
      // Make sure processor is running during export
      trailProcessor?.clearTrails();
      trailProcessor?.start();

      const result = await exportService.exportVideo(
        processedCanvas,
        originalVideo,
        {
          filename: `flowtrails-${video.currentVideo?.metadata.name || 'export'}.webm`,
          onProgress: (progress) => {
            exportProgress = progress;
          }
        }
      );

      // Download the file
      VideoExportService.downloadVideo(result);

      console.log('✅ Export complete:', {
        size: (result.size / 1024 / 1024).toFixed(2) + ' MB',
        duration: result.duration.toFixed(1) + 's'
      });

    } catch (error) {
      console.error('❌ Export failed:', error);
      exportProgress = { state: 'error', progress: 0, message: `Export failed: ${error}` };
    } finally {
      isExporting = false;
      // Reset to current position
      if (originalVideo) {
        originalVideo.pause();
      }
    }
  }

  function handleExportGif() {
    // GIF export would require additional library like gif.js
    // For now, just show a message
    alert('GIF export coming soon! Use video export for now.');
  }
</script>

<main>
  <AppHeader videoState={video} onVideoLoaded={handleVideoLoaded} />

  <div class="main-content">
    <!-- Video Workspace -->
    <section class="video-workspace">
      <div class="video-panels">
        <VideoPanel
          title="Original"
          video={video.currentVideo}
          bind:videoElement={originalVideo}
          placeholderText="Loading video..."
        />
        <ProcessedVideoPanel
          title="Processed"
          sourceVideo={originalVideo}
          config={trailConfig}
          bind:canvasRef={processedCanvas}
          bind:processorRef={trailProcessor}
        />
      </div>

      {#if video.currentVideo}
        <VideoControls
          {isPlaying}
          {currentTime}
          {duration}
          onTogglePlay={togglePlayPause}
          onSeek={seekTo}
        />
      {/if}
    </section>

    <!-- Controls Panel -->
    <EffectControlsPanel
      ledThreshold={effects.ledThreshold}
      ledSensitivity={effects.ledSensitivity}
      trailLength={effects.trailLength}
      trailFade={effects.trailFade}
      onLedThresholdChange={(v) => effects.ledThreshold = v}
      onLedSensitivityChange={(v) => effects.ledSensitivity = v}
      onTrailLengthChange={(v) => effects.trailLength = v}
      onTrailFadeChange={(v) => effects.trailFade = v}
      exportDisabled={!canExport}
      {isExporting}
      {exportProgress}
      onExportVideo={handleExportVideo}
      onExportGif={handleExportGif}
    />
  </div>
</main>

<style>
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

  .main-content {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 2rem;
    padding: 2rem;
    max-height: calc(100vh - 80px);
    overflow: hidden;
  }

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

  @media (max-width: 1200px) {
    .main-content {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr auto;
    }
  }

  @media (max-width: 768px) {
    .video-panels {
      grid-template-columns: 1fr;
    }

    .main-content {
      padding: 1rem;
    }
  }
</style>
