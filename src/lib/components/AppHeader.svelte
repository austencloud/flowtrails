<script lang="ts">
  import { VideoUploader } from '$video';
  import type { VideoFile } from '$shared/types/VideoTypes';

  let {
    videoState,
    onVideoLoaded = () => {}
  } = $props<{
    videoState: {
      loading: boolean;
      error: string | null;
      currentVideo: VideoFile | null;
      hasVideo: boolean;
      loadVideo: (file: File) => Promise<void>;
      unloadVideo: () => void;
    };
    onVideoLoaded?: (video: VideoFile) => void;
  }>();
</script>

<header class="app-header">
  <h1>FlowTrails</h1>
  <div class="header-controls">
    <VideoUploader {videoState} onVideoLoaded={onVideoLoaded} compact={true} />
  </div>
</header>

<style>
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
</style>
