import { injectable } from 'inversify';
import type { 
  ILedDetectionService, 
  LedDetectionConfig, 
  LedDetectionResult 
} from '../contracts/ILedDetectionService';

/**
 * WebGL-based LED Detection Service
 * Detects bright pixels (LEDs) using brightness threshold shaders
 */
@injectable()
export class LedDetectionService implements ILedDetectionService {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private framebuffer: WebGLFramebuffer | null = null;
  private outputTexture: WebGLTexture | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private initialized = false;

  private config: LedDetectionConfig = {
    threshold: 0.7,
    sensitivity: 1.0,
    minArea: 1,
    maxArea: 100,
    colorWeights: { r: 0.299, g: 0.587, b: 0.114 }
  };

  async initialize(gl: WebGL2RenderingContext | GPUDevice): Promise<void> {
    if (gl instanceof WebGL2RenderingContext) {
      this.gl = gl;
      await this.initializeWebGL();
    } else {
      throw new Error('GPU device not yet supported for LED detection');
    }
  }

  private async initializeWebGL(): Promise<void> {
    if (!this.gl) throw new Error('WebGL context not available');

    // Load and compile shaders
    const vertexShaderSource = `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShaderSource = await this.loadShader();
    
    this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
    
    // Create vertex buffer for full-screen quad
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    
    const vertices = new Float32Array([
      -1, -1, 0, 0,  // Bottom-left
       1, -1, 1, 0,  // Bottom-right
      -1,  1, 0, 1,  // Top-left
       1,  1, 1, 1   // Top-right
    ]);
    
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    
    // Create framebuffer for output
    this.framebuffer = this.gl.createFramebuffer();
    this.outputTexture = this.gl.createTexture();
    
    this.initialized = true;
  }

  private async loadShader(): Promise<string> {
    // In a real implementation, you'd load from the shader file
    // For now, return the shader source directly
    return `#version 300 es
precision highp float;

uniform sampler2D u_inputTexture;
uniform float u_threshold;
uniform float u_sensitivity;
uniform vec3 u_colorWeights;

in vec2 v_texCoord;
out vec4 fragColor;

float calculateLuminance(vec3 color) {
    return dot(color, u_colorWeights);
}

void main() {
    vec4 color = texture(u_inputTexture, v_texCoord);
    float luminance = calculateLuminance(color.rgb);
    float adjustedLuminance = luminance * u_sensitivity;
    float detection = step(u_threshold, adjustedLuminance);
    
    fragColor = vec4(detection, luminance, detection * luminance, color.a);
}`;
  }

  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
    if (!this.gl) throw new Error('WebGL context not available');

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);
    
    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error('Program link error: ' + this.gl.getProgramInfoLog(program));
    }
    
    return program;
  }

  private compileShader(type: number, source: string): WebGLShader {
    if (!this.gl) throw new Error('WebGL context not available');

    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error('Shader compile error: ' + this.gl.getShaderInfoLog(shader));
    }
    
    return shader;
  }

  async detectLeds(
    inputTexture: WebGLTexture | GPUTexture,
    config: LedDetectionConfig
  ): Promise<LedDetectionResult> {
    if (!this.initialized || !this.gl || !this.program) {
      throw new Error('LED detection service not initialized');
    }

    const startTime = performance.now();
    
    // Update configuration
    this.updateConfig(config);
    
    // Set up rendering
    this.gl.useProgram(this.program);
    
    // Bind input texture
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, inputTexture as WebGLTexture);
    
    // Set uniforms
    const thresholdLocation = this.gl.getUniformLocation(this.program, 'u_threshold');
    const sensitivityLocation = this.gl.getUniformLocation(this.program, 'u_sensitivity');
    const colorWeightsLocation = this.gl.getUniformLocation(this.program, 'u_colorWeights');
    
    this.gl.uniform1f(thresholdLocation, this.config.threshold);
    this.gl.uniform1f(sensitivityLocation, this.config.sensitivity);
    this.gl.uniform3f(colorWeightsLocation, 
      this.config.colorWeights!.r, 
      this.config.colorWeights!.g, 
      this.config.colorWeights!.b
    );
    
    // Render to output texture
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER, 
      this.gl.COLOR_ATTACHMENT0, 
      this.gl.TEXTURE_2D, 
      this.outputTexture, 
      0
    );
    
    // Draw full-screen quad
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    
    const processingTime = performance.now() - startTime;
    
    return {
      leds: [], // TODO: Extract LED positions from output texture
      maskTexture: this.outputTexture!,
      processingTime,
      ledCount: 0
    };
  }

  updateConfig(config: Partial<LedDetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): LedDetectionConfig {
    return { ...this.config };
  }

  dispose(): void {
    if (this.gl) {
      if (this.program) this.gl.deleteProgram(this.program);
      if (this.framebuffer) this.gl.deleteFramebuffer(this.framebuffer);
      if (this.outputTexture) this.gl.deleteTexture(this.outputTexture);
      if (this.vertexBuffer) this.gl.deleteBuffer(this.vertexBuffer);
    }
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
