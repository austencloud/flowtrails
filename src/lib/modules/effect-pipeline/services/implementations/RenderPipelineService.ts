/**
 * Service for managing the render pipeline
 */

import { injectable, inject } from 'inversify';
import { TYPES } from '$shared/inversify';
import { MODULE_EVENTS, ModuleEventDispatcher } from '$shared';
import type { IRenderPipelineService } from '../contracts/IRenderPipelineService';
import type { ICapabilityDetectionService } from '../contracts/ICapabilityDetectionService';
import type { 
  RenderPipelineConfig, 
  RenderBackend, 
  PipelineInitializationResult,
  ProcessingCapabilities 
} from '../../domain/RenderPipeline';
import type { EffectPipeline } from '$shared';

@injectable()
export class RenderPipelineService implements IRenderPipelineService {
  private backend: RenderBackend | null = null;
  private context: WebGL2RenderingContext | WebGLRenderingContext | GPUCanvasContext | null = null;
  private device: GPUDevice | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private pipeline: EffectPipeline | null = null;
  private capabilities: ProcessingCapabilities | null = null;
  private config: RenderPipelineConfig | null = null;

  constructor(
    @inject(TYPES.ICapabilityDetectionService) 
    private capabilityService: ICapabilityDetectionService
  ) {}

  async initialize(config: RenderPipelineConfig): Promise<PipelineInitializationResult> {
    this.config = config;
    this.canvas = config.canvas;
    this.capabilities = this.capabilityService.detectCapabilities();

    const backends: RenderBackend[] = [
      config.preferredBackend,
      'webgpu',
      'webgl2', 
      'webgl'
    ];

    for (const backend of backends) {
      try {
        if (await this.initializeBackend(backend)) {
          this.backend = backend;
          await this.createRenderTargets();
          
          const result: PipelineInitializationResult = {
            backend: this.backend,
            capabilities: this.capabilities,
            renderTargets: this.pipeline!
          };

          ModuleEventDispatcher.dispatch(MODULE_EVENTS.PIPELINE_INITIALIZED, result);
          console.log(`✅ Initialized ${backend} rendering pipeline`);
          
          return result;
        }
      } catch (error) {
        console.warn(`❌ Failed to initialize ${backend}:`, error);
      }
    }

    throw new Error('No supported rendering backend available');
  }

  private async initializeBackend(backend: RenderBackend): Promise<boolean> {
    if (!this.canvas) throw new Error('Canvas not set');

    switch (backend) {
      case 'webgpu':
        return await this.initializeWebGPU();
      case 'webgl2':
        return this.initializeWebGL2();
      case 'webgl':
        return this.initializeWebGL();
      default:
        return false;
    }
  }

  private async initializeWebGPU(): Promise<boolean> {
    if (!navigator.gpu || !this.canvas) {
      throw new Error('WebGPU not supported');
    }

    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance'
    });

    if (!adapter) {
      throw new Error('No WebGPU adapter available');
    }

    this.device = await adapter.requestDevice({
      requiredLimits: {
        maxTextureDimension2D: 8192,
        maxStorageBufferBindingSize: 256 * 1024 * 1024 // 256MB
      }
    });

    this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
    
    if (!this.context) {
      throw new Error('Failed to get WebGPU context');
    }

    this.context.configure({
      device: this.device,
      format: 'bgra8unorm',
      alphaMode: 'premultiplied'
    });

    return true;
  }

  private initializeWebGL2(): boolean {
    if (!this.canvas) throw new Error('Canvas not set');

    this.context = this.canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    }) as WebGL2RenderingContext;

    if (!this.context) {
      throw new Error('WebGL2 not supported');
    }

    // Check for required extensions
    const requiredExtensions = [
      'EXT_color_buffer_float',
      'OES_texture_float_linear'
    ];

    for (const ext of requiredExtensions) {
      if (!this.context.getExtension(ext)) {
        console.warn(`Missing WebGL2 extension: ${ext}`);
      }
    }

    return true;
  }

  private initializeWebGL(): boolean {
    if (!this.canvas) throw new Error('Canvas not set');

    this.context = this.canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    }) as WebGLRenderingContext;

    if (!this.context) {
      throw new Error('WebGL not supported');
    }

    return true;
  }

  private async createRenderTargets(): Promise<void> {
    if (!this.config) throw new Error('Config not set');
    
    const { width, height } = this.config;

    if (this.backend === 'webgpu' && this.device) {
      this.pipeline = await this.createWebGPURenderTargets(width, height);
    } else if (this.context instanceof WebGL2RenderingContext || this.context instanceof WebGLRenderingContext) {
      this.pipeline = this.createWebGLRenderTargets(width, height);
    }

    if (this.pipeline) {
      ModuleEventDispatcher.dispatch(MODULE_EVENTS.RENDER_TARGET_READY, {
        pipeline: this.pipeline,
        backend: this.backend
      });
    }
  }

  private async createWebGPURenderTargets(width: number, height: number): Promise<EffectPipeline> {
    if (!this.device) throw new Error('WebGPU device not initialized');

    const textureDescriptor: GPUTextureDescriptor = {
      size: { width, height },
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    };

    const inputTexture = this.device.createTexture(textureDescriptor);
    const trailTexture = this.device.createTexture(textureDescriptor);
    const outputTexture = this.device.createTexture(textureDescriptor);
    const maskTexture = this.device.createTexture({
      ...textureDescriptor,
      format: 'r8unorm'
    });

    return {
      inputTarget: { width, height, texture: inputTexture },
      trailBuffer: { width, height, texture: trailTexture },
      outputTarget: { width, height, texture: outputTexture },
      maskTexture
    };
  }

  private createWebGLRenderTargets(width: number, height: number): EffectPipeline {
    const gl = this.context as WebGL2RenderingContext | WebGLRenderingContext;

    const createTexture = () => {
      const texture = gl.createTexture();
      if (!texture) throw new Error('Failed to create texture');
      
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      
      return texture;
    };

    const createFramebuffer = (texture: WebGLTexture) => {
      const framebuffer = gl.createFramebuffer();
      if (!framebuffer) throw new Error('Failed to create framebuffer');
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        throw new Error('Framebuffer not complete');
      }
      
      return framebuffer;
    };

    const inputTexture = createTexture();
    const trailTexture = createTexture();
    const outputTexture = createTexture();
    const maskTexture = createTexture();

    return {
      inputTarget: { 
        width, 
        height, 
        texture: inputTexture,
        framebuffer: createFramebuffer(inputTexture)
      },
      trailBuffer: { 
        width, 
        height, 
        texture: trailTexture,
        framebuffer: createFramebuffer(trailTexture)
      },
      outputTarget: { 
        width, 
        height, 
        texture: outputTexture,
        framebuffer: createFramebuffer(outputTexture)
      },
      maskTexture
    };
  }

  async resize(width: number, height: number): Promise<void> {
    if (this.config) {
      this.config.width = width;
      this.config.height = height;
      await this.createRenderTargets();
    }
  }

  getPipeline(): EffectPipeline | null {
    return this.pipeline;
  }

  getBackend(): RenderBackend | null {
    return this.backend;
  }

  getCapabilities(): ProcessingCapabilities | null {
    return this.capabilities;
  }

  destroy(): void {
    if (this.device) {
      this.device.destroy();
    }
    
    this.pipeline = null;
    this.context = null;
    this.device = null;
    this.canvas = null;
    this.config = null;
    
    ModuleEventDispatcher.dispatch(MODULE_EVENTS.PIPELINE_DESTROYED, {});
  }
}
