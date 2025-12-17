<script lang="ts">
  import type { VideoFile } from '$shared/types/VideoTypes';

  let {
    title,
    video = null,
    videoElement = $bindable<HTMLVideoElement | undefined>(undefined),
    infoSlot = null,
    placeholderIcon = '📹',
    placeholderText = 'No video loaded',
    placeholderSubtext = '',
    isProcessed = false
  } = $props<{
    title: string;
    video?: VideoFile | null;
    videoElement?: HTMLVideoElement;
    infoSlot?: string | null;
    placeholderIcon?: string;
    placeholderText?: string;
    placeholderSubtext?: string;
    isProcessed?: boolean;
  }>();
</script>

<div class="video-panel">
  <div class="panel-header">
    <h3>{title}</h3>
    <div class="video-info">
      {#if video && !isProcessed}
        <span class="duration">{Math.round(video.metadata.duration)}s</span>
        <span class="resolution">{video.metadata.width}×{video.metadata.height}</span>
      {:else if infoSlot}
        <span class="status">{infoSlot}</span>
      {/if}
    </div>
  </div>
  <div class="video-container">
    {#if video}
      <video
        bind:this={videoElement}
        class="main-video"
        src={video.url}
        preload="auto"
        muted
        playsinline
      ></video>
    {:else}
      <div class="video-placeholder" class:processed={isProcessed}>
        <div class="placeholder-content">
          <div class="placeholder-icon">{placeholderIcon}</div>
          <p>{placeholderText}</p>
          {#if placeholderSubtext}
            <small>{placeholderSubtext}</small>
          {/if}
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

  .video-info .duration { color: #00d4ff; }
  .video-info .resolution { color: #4ade80; }
  .video-info .status { color: #fbbf24; }

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
</style>
