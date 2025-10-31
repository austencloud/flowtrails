/**
 * Service for detecting rendering capabilities
 */

import { injectable } from 'inversify';
import type { ICapabilityDetectionService } from '../contracts/ICapabilityDetectionService';
import type { ProcessingCapabilities } from '$shared/types/EffectTypes';

@injectable()
export class CapabilityDetectionService implements ICapabilityDetectionService {
  
  detectCapabilities(): ProcessingCapabilities {
    return {
      maxResolution: { width: this.getMaxTextureSize(), height: this.getMaxTextureSize() },
      maxFPS: this.estimateMaxFPS(),
      supportsWebGPU: this.supportsWebGPU(),
      supportsWebGL2: this.supportsWebGL2(),
      supportsFloatTextures: this.supportsFloatTextures(),
      memoryLimit: this.estimateGPUMemory()
    };
  }

  supportsWebGPU(): boolean {
    return !!navigator.gpu;
  }

  supportsWebGL2(): boolean {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');
    return !!context;
  }

  supportsWebGL(): boolean {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl');
    return !!context;
  }

  getMaxTextureSize(): number {
    // Try WebGL2 first
    const canvas = document.createElement('canvas');
    let gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
    
    if (!gl) {
      gl = canvas.getContext('webgl') as WebGL2RenderingContext;
    }

    if (gl) {
      return gl.getParameter(gl.MAX_TEXTURE_SIZE);
    }

    // Fallback
    return 4096;
  }

  estimateGPUMemory(): number {
    // This is a rough estimation based on device capabilities
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) return 512; // 512MB fallback

    // Try to get renderer info
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      // Basic heuristics based on GPU names
      if (renderer.includes('RTX 4090') || renderer.includes('RTX 4080')) return 16384; // 16GB
      if (renderer.includes('RTX 40') || renderer.includes('RTX 30')) return 8192; // 8GB
      if (renderer.includes('RTX') || renderer.includes('GTX')) return 4096; // 4GB
      if (renderer.includes('Intel') || renderer.includes('AMD')) return 2048; // 2GB
    }

    // Default estimation
    return 1024; // 1GB
  }

  private estimateMaxFPS(): number {
    // Estimate based on capabilities
    if (this.supportsWebGPU()) return 120;
    if (this.supportsWebGL2()) return 60;
    return 30;
  }

  private supportsFloatTextures(): boolean {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) return false;

    // Check for float texture support
    if (gl instanceof WebGL2RenderingContext) {
      return !!gl.getExtension('EXT_color_buffer_float');
    } else {
      return !!gl.getExtension('OES_texture_float');
    }
  }
}
