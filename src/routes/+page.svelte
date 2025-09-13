<script lang="ts">
  import '../app'; // Initialize DI container
  import { VideoUploader } from '$video';
  import { RenderCanvas } from '$pipeline';
  import type { VideoFile } from '$shared';

  let currentVideo: VideoFile | null = $state(null);

  function handleVideoLoaded(video: VideoFile) {
    currentVideo = video;
    console.log('Video loaded:', video);
  }
</script>

<main>
  <h1>ARFlowArts Clone</h1>
  <p>High-performance web-based flow arts video processing</p>

  <section class="video-section">
    <h2>1. Upload Video</h2>
    <VideoUploader onVideoLoaded={handleVideoLoaded} />

    {#if currentVideo}
      <div class="video-preview">
        <h3>Video Preview</h3>
        <video
          bind:this={currentVideo.element}
          controls
          width="400"
          height="300"
        >
          <source src={currentVideo.url} type="video/{currentVideo.metadata.format}">
          Your browser does not support the video tag.
        </video>
      </div>
    {/if}
  </section>

  <section class="pipeline-section">
    <h2>2. Effect Pipeline</h2>
    <p>High-performance WebGL/WebGPU rendering engine</p>
    <RenderCanvas width={800} height={450} />
  </section>

  <section class="coming-soon">
    <h2>Coming Soon</h2>
    <ul>
      <li>🎯 LED Detection & Thresholding</li>
      <li>✨ Real-time Trail Effects</li>
      <li>📹 Video Export & Download</li>
    </ul>
  </section>
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    color: #007acc;
    text-align: center;
    margin-bottom: 0.5rem;
  }

  main > p {
    text-align: center;
    color: #666;
    margin-bottom: 3rem;
  }

  .video-section, .pipeline-section {
    margin-bottom: 3rem;
  }

  .video-preview {
    margin-top: 2rem;
    text-align: center;
  }

  .video-preview video {
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }

  .coming-soon {
    background: #f8f9fa;
    padding: 2rem;
    border-radius: 8px;
  }

  .coming-soon ul {
    list-style: none;
    padding: 0;
  }

  .coming-soon li {
    padding: 0.5rem 0;
    font-size: 1.1rem;
  }
</style>
