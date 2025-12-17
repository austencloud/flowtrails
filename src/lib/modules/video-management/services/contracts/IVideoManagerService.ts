/**
 * Video Manager Service Contract
 * Handles video file loading, validation, and metadata extraction
 */

import type { VideoFile, VideoMetadata, VideoPlaybackState } from '$shared/types/VideoTypes';

export interface IVideoManagerService {
  /**
   * Load and validate a video file
   */
  loadVideo(file: File): Promise<VideoFile>;

  /**
   * Unload current video and cleanup resources
   */
  unloadVideo(): void;

  /**
   * Get current video file
   */
  getCurrentVideo(): VideoFile | null;

  /**
   * Create playback state tracker for a video element
   */
  createPlaybackState(video: HTMLVideoElement): VideoPlaybackState;

  /**
   * Validate if a file is a supported video format
   */
  validateFile(file: File): void;

  /**
   * Get list of supported video formats
   */
  getSupportedFormats(): readonly string[];
}
