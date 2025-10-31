/**
 * Core video processing types for ARFlowArts
 */

export interface VideoMetadata {
  name: string;
  size: number;
  type: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  format: string;
  bitrate?: number;
  codec?: string;
}

export interface VideoFile {
  file: File;
  url: string;
  metadata: VideoMetadata;
  element: HTMLVideoElement;
}

export interface VideoProcessingOptions {
  outputFormat: 'mp4' | 'webm';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  fps?: number;
  resolution?: {
    width: number;
    height: number;
  };
}

export interface VideoExportSettings {
  format: 'mp4' | 'webm';
  quality: number; // 0-1
  bitrate?: number;
  fps?: number;
  includeAudio: boolean;
}

export type VideoState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'seeking' | 'error';

export interface VideoPlaybackState {
  state: VideoState;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
}
