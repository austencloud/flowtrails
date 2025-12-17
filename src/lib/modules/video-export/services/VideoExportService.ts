/**
 * Video Export Service
 * Records canvas output to video file using MediaRecorder API
 */

export interface ExportOptions {
  filename?: string;
  mimeType?: string;
  videoBitsPerSecond?: number;
  onProgress?: (progress: ExportProgress) => void;
}

export interface ExportProgress {
  state: 'preparing' | 'recording' | 'processing' | 'complete' | 'error';
  progress: number; // 0-1
  currentTime?: number;
  duration?: number;
  message?: string;
}

export interface ExportResult {
  blob: Blob;
  url: string;
  filename: string;
  duration: number;
  size: number;
}

export class VideoExportService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isExporting = false;

  /**
   * Get supported MIME types for video recording
   */
  static getSupportedMimeTypes(): string[] {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    return types.filter(type => MediaRecorder.isTypeSupported(type));
  }

  /**
   * Export canvas content as video
   * Plays the source video from start to end while recording the canvas
   */
  async exportVideo(
    canvas: HTMLCanvasElement,
    sourceVideo: HTMLVideoElement,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    if (this.isExporting) {
      throw new Error('Export already in progress');
    }

    const {
      filename = `flowtrails-export-${Date.now()}.webm`,
      mimeType = VideoExportService.getSupportedMimeTypes()[0] || 'video/webm',
      videoBitsPerSecond = 5000000, // 5 Mbps
      onProgress
    } = options;

    this.isExporting = true;
    this.recordedChunks = [];

    const duration = sourceVideo.duration;

    try {
      onProgress?.({
        state: 'preparing',
        progress: 0,
        message: 'Preparing export...'
      });

      // Get canvas stream
      const stream = canvas.captureStream(30); // 30 FPS

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond
      });

      // Collect recorded chunks
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      // Create promise for recording completion
      const recordingComplete = new Promise<Blob>((resolve, reject) => {
        this.mediaRecorder!.onstop = () => {
          const blob = new Blob(this.recordedChunks, { type: mimeType });
          resolve(blob);
        };

        this.mediaRecorder!.onerror = (event) => {
          reject(new Error('MediaRecorder error'));
        };
      });

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms

      onProgress?.({
        state: 'recording',
        progress: 0,
        currentTime: 0,
        duration,
        message: 'Recording...'
      });

      // Seek to beginning and play
      sourceVideo.currentTime = 0;
      await new Promise(resolve => {
        sourceVideo.addEventListener('seeked', resolve, { once: true });
      });

      // Play video and track progress
      await sourceVideo.play();

      // Wait for video to end or track progress
      await new Promise<void>((resolve) => {
        const checkProgress = () => {
          if (!this.isExporting) {
            resolve();
            return;
          }

          const progress = sourceVideo.currentTime / duration;
          onProgress?.({
            state: 'recording',
            progress,
            currentTime: sourceVideo.currentTime,
            duration,
            message: `Recording: ${Math.round(progress * 100)}%`
          });

          if (sourceVideo.ended || sourceVideo.currentTime >= duration - 0.1) {
            resolve();
          } else {
            requestAnimationFrame(checkProgress);
          }
        };
        checkProgress();
      });

      // Stop recording
      sourceVideo.pause();
      this.mediaRecorder.stop();

      onProgress?.({
        state: 'processing',
        progress: 0.95,
        message: 'Processing video...'
      });

      // Wait for recording to complete
      const blob = await recordingComplete;

      // Create download URL
      const url = URL.createObjectURL(blob);

      onProgress?.({
        state: 'complete',
        progress: 1,
        message: 'Export complete!'
      });

      return {
        blob,
        url,
        filename,
        duration,
        size: blob.size
      };

    } catch (error) {
      onProgress?.({
        state: 'error',
        progress: 0,
        message: `Export failed: ${error}`
      });
      throw error;
    } finally {
      this.isExporting = false;
      this.mediaRecorder = null;
    }
  }

  /**
   * Cancel ongoing export
   */
  cancelExport(): void {
    if (this.mediaRecorder && this.isExporting) {
      this.mediaRecorder.stop();
      this.isExporting = false;
    }
  }

  /**
   * Download the exported video
   */
  static downloadVideo(result: ExportResult): void {
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Check if export is supported
   */
  static isSupported(): boolean {
    return typeof MediaRecorder !== 'undefined' &&
           typeof HTMLCanvasElement.prototype.captureStream === 'function';
  }
}

/**
 * Create a new export service instance
 */
export function createVideoExportService(): VideoExportService {
  return new VideoExportService();
}
