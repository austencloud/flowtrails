/**
 * Video Synchronization Service Implementation
 * Handles synchronization between source and processed video elements
 */

import { injectable } from 'inversify';
import type { IVideoSyncService, VideoSyncConfig, VideoSyncState } from '../contracts/IVideoSyncService';

@injectable()
export class VideoSyncService implements IVideoSyncService {
  private config: VideoSyncConfig | null = null;
  private cleanupFunctions: Array<() => void> = [];
  private syncInterval: number | null = null;

  sync(config: VideoSyncConfig): () => void {
    this.cleanup();
    this.config = config;

    const { sourceVideo, targetVideo, syncTolerance = 0.1, onStateChange } = config;

    // Sync target src with source (only if source has a valid src)
    if (sourceVideo.src && sourceVideo.src !== targetVideo.src) {
      targetVideo.src = sourceVideo.src;
    }

    const syncPlayback = () => {
      const timeDiff = Math.abs(targetVideo.currentTime - sourceVideo.currentTime);
      if (timeDiff > syncTolerance) {
        targetVideo.currentTime = sourceVideo.currentTime;
      }
    };

    const updateState = () => {
      if (onStateChange) {
        onStateChange({
          isPlaying: !sourceVideo.paused,
          currentTime: sourceVideo.currentTime,
          duration: sourceVideo.duration || 0
        });
      }
    };

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

    sourceVideo.addEventListener('play', handlePlay);
    sourceVideo.addEventListener('pause', handlePause);
    sourceVideo.addEventListener('timeupdate', handleTimeUpdate);
    sourceVideo.addEventListener('seeked', handleSeeked);
    sourceVideo.addEventListener('loadedmetadata', handleLoadedMetadata);
    sourceVideo.addEventListener('canplay', updateState);

    this.cleanupFunctions = [
      () => sourceVideo.removeEventListener('play', handlePlay),
      () => sourceVideo.removeEventListener('pause', handlePause),
      () => sourceVideo.removeEventListener('timeupdate', handleTimeUpdate),
      () => sourceVideo.removeEventListener('seeked', handleSeeked),
      () => sourceVideo.removeEventListener('loadedmetadata', handleLoadedMetadata),
      () => sourceVideo.removeEventListener('canplay', updateState)
    ];

    // Fire initial state immediately if video is already loaded
    if (sourceVideo.readyState >= 1) {
      updateState();
    }

    this.syncInterval = window.setInterval(syncPlayback, 1000);
    this.cleanupFunctions.push(() => {
      if (this.syncInterval !== null) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }
    });

    return () => this.cleanup();
  }

  cleanup(): void {
    this.cleanupFunctions.forEach(fn => fn());
    this.cleanupFunctions = [];
    this.config = null;
  }

  isSyncing(): boolean {
    return this.config !== null;
  }

  getConfig(): VideoSyncConfig | null {
    return this.config;
  }
}
