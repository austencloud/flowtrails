<!--
  FlowTrails Module Entry Point

  Use this component to embed FlowTrails as a feature within TKA-SCRIBE
  or run standalone. Provides a clean integration boundary.

  Usage in TKA-SCRIBE:
    <FlowTrailsModule
      initialVideoUrl="/path/to/video.mp4"
      onExportComplete={(blob) => handleExport(blob)}
    />
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createAppState } from '$shared/state/app-state.svelte';
  import { AppHeader, VideoPanel, VideoControls, EffectControlsPanel } from '$lib/components';

  // Props for integration
  let {
    initialVideoUrl = '',
    showHeader = true,
    onExportComplete = (blob: Blob) => {},
    onVideoLoaded = (file: File) => {},
    class: className = ''
  } = $props<{
    initialVideoUrl?: string;
    showHeader?: boolean;
    onExportComplete?: (blob: Blob) => void;
    onVideoLoaded?: (file: File) => void;
    class?: string;
  }>();

  // Create unified app state
  const appState = createAppState();
  const { video, effects, services } = appState;
  const videoSyncService = services.videoSync;

  // Local UI state
  let processedVideo: HTMLVideoElement | undefined = $state();
  let isPlaying = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);

  // Load initial video if provided
  $effect(() => {
    if (initialVideoUrl && typeof window !== 'undefined') {
      loadVideoFromUrl(initialVideoUrl);
    }
  });

  // Set up video synchronization
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
      return cleanup;
    }
  });

  async function loadVideoFromUrl(url: string) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const filename = url.split('/').pop() || 'video.mp4';
      const file = new File([blob], filename, { type: 'video/mp4' });
      await video.loadVideo(file);
      onVideoLoaded(file);
    } catch (error) {
      console.error('Failed to load video:', error);
    }
  }

  function handleVideoLoaded(file: File) {
    video.loadVideo(file);
    onVideoLoaded(file);
  }

  function togglePlayPause() {
    if (isPlaying) video.pause();
    else video.play();
  }

  function seekTo(time: number) {
    video.seek(time);
  }

  // Cleanup on unmount
  onDestroy(() => {
    appState.destroy();
  });
</script>

<div class="flowtrails-module {className}">
  {#if showHeader}
    <AppHeader onVideoLoaded={handleVideoLoaded} />
  {/if}

  <div class="flowtrails-content">
    <section class="video-workspace">
      <div class="video-panels">
        <VideoPanel
          title="Original"
          video={video.currentVideo}
          placeholderText="Drop a video or click upload"
        />
        <VideoPanel
          title="Processed"
          video={video.currentVideo}
          bind:videoElement={processedVideo}
          infoSlot="Trail effects"
          isProcessed={true}
          placeholderIcon="✨"
          placeholderText="Effects preview"
          placeholderSubtext="Real-time processing"
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

    <EffectControlsPanel
      ledThreshold={effects.ledThreshold}
      ledSensitivity={effects.ledSensitivity}
      trailLength={effects.trailLength}
      trailFade={effects.trailFade}
      onLedThresholdChange={(v) => effects.ledThreshold = v}
      onLedSensitivityChange={(v) => effects.ledSensitivity = v}
      onTrailLengthChange={(v) => effects.trailLength = v}
      onTrailFadeChange={(v) => effects.trailFade = v}
      exportDisabled={!video.currentVideo}
    />
  </div>
</div>

<style>
  .flowtrails-module {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
    color: #e0e0e0;
  }

  .flowtrails-content {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 2rem;
    padding: 2rem;
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
    .flowtrails-content {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr auto;
    }
  }

  @media (max-width: 768px) {
    .video-panels {
      grid-template-columns: 1fr;
    }

    .flowtrails-content {
      padding: 1rem;
    }
  }
</style>
