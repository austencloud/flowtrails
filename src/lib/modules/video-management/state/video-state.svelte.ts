/**
 * Reactive video state management using Svelte 5 runes
 */

import type { VideoFile, VideoPlaybackState } from '$shared/types/VideoTypes';
import { VideoManager } from '../domain/VideoManager';

export function createVideoState() {
  const videoManager = new VideoManager();
  
  // Reactive state
  let currentVideo = $state<VideoFile | null>(null);
  let playbackState = $state<VideoPlaybackState | null>(null);
  let loading = $state<boolean>(false);
  let error = $state<string | null>(null);

  // Derived state
  const hasVideo = $derived(() => currentVideo !== null);
  const isPlaying = $derived(() => playbackState?.state === 'playing');
  const duration = $derived(() => playbackState?.duration || 0);
  const currentTime = $derived(() => playbackState?.currentTime || 0);
  const progress = $derived(() => {
    if (!playbackState || !playbackState.duration) return 0;
    return playbackState.currentTime / playbackState.duration;
  });

  // Actions
  async function loadVideo(file: File) {
    loading = true;
    error = null;
    
    try {
      const videoFile = await videoManager.loadVideo(file);
      currentVideo = videoFile;
      playbackState = videoManager.createPlaybackState(videoFile.element);
      
      // Set up playback state tracking
      setupPlaybackTracking(videoFile.element);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load video';
      console.error('Video loading error:', err);
    } finally {
      loading = false;
    }
  }

  function unloadVideo() {
    videoManager.unloadVideo();
    currentVideo = null;
    playbackState = null;
    error = null;
  }

  function play() {
    if (currentVideo?.element) {
      currentVideo.element.play();
    }
  }

  function pause() {
    if (currentVideo?.element) {
      currentVideo.element.pause();
    }
  }

  function seek(time: number) {
    if (currentVideo?.element) {
      currentVideo.element.currentTime = time;
    }
  }

  function setVolume(volume: number) {
    if (currentVideo?.element) {
      currentVideo.element.volume = Math.max(0, Math.min(1, volume));
    }
  }

  function setMuted(muted: boolean) {
    if (currentVideo?.element) {
      currentVideo.element.muted = muted;
    }
  }

  function setPlaybackRate(rate: number) {
    if (currentVideo?.element) {
      currentVideo.element.playbackRate = rate;
    }
  }

  // Set up event listeners for playback state tracking
  function setupPlaybackTracking(video: HTMLVideoElement) {
    const updatePlaybackState = () => {
      if (playbackState) {
        playbackState.currentTime = video.currentTime;
        playbackState.volume = video.volume;
        playbackState.muted = video.muted;
        playbackState.playbackRate = video.playbackRate;
      }
    };

    const updateState = (state: VideoPlaybackState['state']) => {
      if (playbackState) {
        playbackState.state = state;
      }
    };

    video.addEventListener('play', () => updateState('playing'));
    video.addEventListener('pause', () => updateState('paused'));
    video.addEventListener('seeking', () => updateState('seeking'));
    video.addEventListener('seeked', () => updateState(video.paused ? 'paused' : 'playing'));
    video.addEventListener('timeupdate', updatePlaybackState);
    video.addEventListener('volumechange', updatePlaybackState);
    video.addEventListener('ratechange', updatePlaybackState);
    video.addEventListener('error', () => updateState('error'));
  }

  return {
    // State
    get currentVideo() { return currentVideo; },
    get playbackState() { return playbackState; },
    get loading() { return loading; },
    get error() { return error; },
    
    // Derived state
    get hasVideo() { return hasVideo; },
    get isPlaying() { return isPlaying; },
    get duration() { return duration; },
    get currentTime() { return currentTime; },
    get progress() { return progress; },
    
    // Actions
    loadVideo,
    unloadVideo,
    play,
    pause,
    seek,
    setVolume,
    setMuted,
    setPlaybackRate
  };
}
