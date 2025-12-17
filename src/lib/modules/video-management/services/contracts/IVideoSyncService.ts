/**
 * Video Synchronization Service Contract
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
  onStateChange?: (state: VideoSyncState) => void;
}

export interface VideoSyncState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export interface IVideoSyncService {
  /**
   * Start syncing two video elements
   * @returns Cleanup function to stop syncing
   */
  sync(config: VideoSyncConfig): () => void;

  /**
   * Stop syncing and cleanup event listeners
   */
  cleanup(): void;

  /**
   * Check if currently syncing
   */
  isSyncing(): boolean;

  /**
   * Get current sync configuration
   */
  getConfig(): VideoSyncConfig | null;
}
