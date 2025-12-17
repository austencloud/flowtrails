/**
 * Video Manager Service Implementation
 * Handles video file loading, validation, and metadata extraction
 */

import { injectable } from 'inversify';
import type { VideoFile, VideoMetadata, VideoPlaybackState } from '$shared/types/VideoTypes';
import type { IVideoManagerService } from '../contracts/IVideoManagerService';

@injectable()
export class VideoManagerService implements IVideoManagerService {
  private currentVideo: VideoFile | null = null;
  private readonly supportedFormats = ['mp4', 'webm', 'mov', 'avi'] as const;

  /**
   * Load and validate a video file
   */
  async loadVideo(file: File): Promise<VideoFile> {
    this.validateFile(file);

    const url = URL.createObjectURL(file);
    const element = document.createElement('video');
    element.src = url;
    element.crossOrigin = 'anonymous';

    const metadata = await this.extractMetadata(element, file);

    const videoFile: VideoFile = {
      file,
      url,
      metadata,
      element
    };

    this.currentVideo = videoFile;

    return videoFile;
  }

  /**
   * Unload current video and cleanup resources
   */
  unloadVideo(): void {
    if (this.currentVideo) {
      URL.revokeObjectURL(this.currentVideo.url);
      this.currentVideo.element.remove();
      this.currentVideo = null;
    }
  }

  /**
   * Get current video file
   */
  getCurrentVideo(): VideoFile | null {
    return this.currentVideo;
  }

  /**
   * Get list of supported video formats
   */
  getSupportedFormats(): readonly string[] {
    return this.supportedFormats;
  }

  /**
   * Validate file format and size
   */
  validateFile(file: File): void {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !this.supportedFormats.includes(extension as any)) {
      throw new Error(`Unsupported file format: ${extension}. Supported formats: ${this.supportedFormats.join(', ')}`);
    }

    // Check file size (limit to 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size: 500MB`);
    }
  }

  /**
   * Extract video metadata
   */
  private async extractMetadata(video: HTMLVideoElement, file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout loading video metadata'));
      }, 10000);

      video.addEventListener('loadedmetadata', () => {
        clearTimeout(timeout);

        const metadata: VideoMetadata = {
          name: file.name,
          size: file.size,
          type: file.type,
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          fps: this.estimateFPS(video),
          format: file.name.split('.').pop()?.toLowerCase() || 'mp4'
        };

        resolve(metadata);
      });

      video.addEventListener('error', () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load video'));
      });
    });
  }

  /**
   * Estimate video FPS (simplified approach)
   */
  private estimateFPS(video: HTMLVideoElement): number {
    // Default to 30fps if we can't determine
    // In a real implementation, you might use ffmpeg.wasm or other tools
    return 30;
  }

  /**
   * Create playback state tracker
   */
  createPlaybackState(video: HTMLVideoElement): VideoPlaybackState {
    return {
      state: 'ready',
      currentTime: video.currentTime,
      duration: video.duration,
      volume: video.volume,
      muted: video.muted,
      playbackRate: video.playbackRate
    };
  }
}
