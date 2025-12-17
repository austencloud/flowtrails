/**
 * Video Synchronization Service
 * Handles synchronization between source and processed video elements
 */

export interface VideoSyncConfig {
  /** Source video element (controls playback) */
  sourceVideo: HTMLVideoElement;
  /** Target video element (follows source) */
  targetVideo: HTMLVideoElement;
  /** Sync tolerance in seconds (default: 0.1) */
  syncTolerance?: number;
  /** Callback when playback state changes */
  onStateChange?: (state: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
  }) => void;
}

export class VideoSyncService {
  private config: VideoSyncConfig | null = null;
  private cleanupFunctions: Array<() => void> = [];
  private syncInterval: number | null = null;

  /**
   * Start syncing two video elements
   */
  sync(config: VideoSyncConfig): () => void {
    this.cleanup(); // Clean up any existing sync
    this.config = config;

    const { sourceVideo, targetVideo, syncTolerance = 0.1, onStateChange } = config;

    // Set target video source
    targetVideo.src = sourceVideo.src;

    // Helper to sync playback position
    const syncPlayback = () => {
      const timeDiff = Math.abs(targetVideo.currentTime - sourceVideo.currentTime);
      if (timeDiff > syncTolerance) {
        targetVideo.currentTime = sourceVideo.currentTime;
      }
    };

    // Helper to update state callback
    const updateState = () => {
      if (onStateChange) {
        onStateChange({
          isPlaying: !sourceVideo.paused,
          currentTime: sourceVideo.currentTime,
          duration: sourceVideo.duration || 0
        });
      }
    };

    // Event handlers
    const handlePlay = () => {
      targetVideo.play().catch(err => {
        console.warn('Failed to play target video:', err);
      });
      updateState();
    };

    const handlePause = () => {
      targetVideo.pause();
      updateState();
    };

    const handleTimeUpdate = () => {
      syncPlayback();
      updateState();
    };

    const handleSeeked = () => {
      targetVideo.currentTime = sourceVideo.currentTime;
      updateState();
    };

    const handleLoadedMetadata = () => {
      updateState();
    };

    // Attach event listeners
    sourceVideo.addEventListener('play', handlePlay);
    sourceVideo.addEventListener('pause', handlePause);
    sourceVideo.addEventListener('timeupdate', handleTimeUpdate);
    sourceVideo.addEventListener('seeked', handleSeeked);
    sourceVideo.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Store cleanup functions
    this.cleanupFunctions = [
      () => sourceVideo.removeEventListener('play', handlePlay),
      () => sourceVideo.removeEventListener('pause', handlePause),
      () => sourceVideo.removeEventListener('timeupdate', handleTimeUpdate),
      () => sourceVideo.removeEventListener('seeked', handleSeeked),
      () => sourceVideo.removeEventListener('loadedmetadata', handleLoadedMetadata)
    ];

    // Periodic sync check (backup for missed events)
    this.syncInterval = window.setInterval(syncPlayback, 1000);
    this.cleanupFunctions.push(() => {
      if (this.syncInterval !== null) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }
    });

    // Return cleanup function
    return () => this.cleanup();
  }

  /**
   * Stop syncing and cleanup event listeners
   */
  cleanup(): void {
    this.cleanupFunctions.forEach(fn => fn());
    this.cleanupFunctions = [];
    this.config = null;
  }

  /**
   * Check if currently syncing
   */
  isSyncing(): boolean {
    return this.config !== null;
  }

  /**
   * Get current sync configuration
   */
  getConfig(): VideoSyncConfig | null {
    return this.config;
  }
}
