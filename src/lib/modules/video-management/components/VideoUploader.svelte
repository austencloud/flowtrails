<script lang="ts">
  import { createVideoState } from '../state/video-state.svelte';
  
  // Props
  let { 
    onVideoLoaded = () => {},
    acceptedFormats = '.mp4,.webm,.mov,.avi',
    maxSizeMB = 500 
  } = $props();

  // State
  const videoState = createVideoState();
  let dragOver = $state(false);
  let fileInput: HTMLInputElement;

  // Handle file selection
  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      await loadVideoFile(file);
    }
  }

  // Handle drag and drop
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragOver = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    dragOver = false;
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragOver = false;
    
    const file = event.dataTransfer?.files[0];
    if (file) {
      await loadVideoFile(file);
    }
  }

  // Load video file
  async function loadVideoFile(file: File) {
    await videoState.loadVideo(file);
    
    if (videoState.currentVideo) {
      onVideoLoaded(videoState.currentVideo);
    }
  }

  // Format file size
  function formatFileSize(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }
</script>

<div class="video-uploader">
  <!-- File Input -->
  <input
    bind:this={fileInput}
    type="file"
    accept={acceptedFormats}
    onchange={handleFileSelect}
    style="display: none;"
  />

  <!-- Drop Zone -->
  <div
    class="drop-zone"
    class:drag-over={dragOver}
    class:has-video={videoState.hasVideo}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    role="button"
    tabindex="0"
    onclick={() => fileInput.click()}
    onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
  >
    {#if videoState.loading}
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading video...</p>
      </div>
    {:else if videoState.error}
      <div class="error">
        <p>❌ {videoState.error}</p>
        <button onclick={() => fileInput.click()}>Try Again</button>
      </div>
    {:else if videoState.currentVideo}
      <div class="video-info">
        <p>✅ Video loaded successfully</p>
        <div class="metadata">
          <span>{videoState.currentVideo.metadata.width}×{videoState.currentVideo.metadata.height}</span>
          <span>{videoState.currentVideo.metadata.duration.toFixed(1)}s</span>
          <span>{formatFileSize(videoState.currentVideo.file.size)}</span>
        </div>
        <button onclick={(e) => { e.stopPropagation(); videoState.unloadVideo(); }}>Remove Video</button>
      </div>
    {:else}
      <div class="upload-prompt">
        <div class="icon">📹</div>
        <h3>Upload Video</h3>
        <p>Drag and drop a video file here, or click to browse</p>
        <div class="supported-formats">
          <small>Supported formats: MP4, WebM, MOV, AVI (max {maxSizeMB}MB)</small>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .video-uploader {
    width: 100%;
  }

  .drop-zone {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #fafafa;
  }

  .drop-zone:hover {
    border-color: #007acc;
    background: #f0f8ff;
  }

  .drop-zone.drag-over {
    border-color: #007acc;
    background: #e6f3ff;
    transform: scale(1.02);
  }

  .drop-zone.has-video {
    border-color: #28a745;
    background: #f8fff9;
  }

  .upload-prompt .icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .upload-prompt h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }

  .upload-prompt p {
    margin: 0 0 1rem 0;
    color: #666;
  }

  .supported-formats {
    color: #888;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #007acc;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error {
    color: #dc3545;
  }

  .error button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: #007acc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .video-info {
    color: #28a745;
  }

  .metadata {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin: 0.5rem 0;
    font-family: monospace;
    font-size: 0.9rem;
  }

  .video-info button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
</style>
