#version 300 es
precision highp float;

// Input textures
uniform sampler2D u_currentFrame;    // Current video frame
uniform sampler2D u_previousTrails;  // Previous trail buffer
uniform sampler2D u_ledMask;         // LED detection mask

// Trail parameters
uniform float u_trailLength;         // Trail persistence (0.0 - 1.0)
uniform float u_fadeRate;           // Fade rate per frame (0.0 - 1.0)
uniform float u_opacity;            // Overall trail opacity
uniform vec4 u_tint;                // Trail color tint (RGBA)
uniform float u_motionBlur;         // Motion blur amount
uniform float u_thickness;          // Trail thickness multiplier

// Blend mode
uniform int u_blendMode;            // 0=normal, 1=additive, 2=multiply, 3=screen, 4=overlay

// Texture coordinates
in vec2 v_texCoord;

// Output
out vec4 fragColor;

/**
 * Apply different blend modes
 */
vec3 applyBlendMode(vec3 base, vec3 overlay, int mode) {
    switch (mode) {
        case 1: // Additive
            return base + overlay;
        case 2: // Multiply
            return base * overlay;
        case 3: // Screen
            return 1.0 - (1.0 - base) * (1.0 - overlay);
        case 4: // Overlay
            return mix(
                2.0 * base * overlay,
                1.0 - 2.0 * (1.0 - base) * (1.0 - overlay),
                step(0.5, base)
            );
        default: // Normal
            return mix(base, overlay, overlay.a);
    }
}

/**
 * Sample with motion blur
 */
vec4 sampleWithMotionBlur(sampler2D tex, vec2 texCoord) {
    if (u_motionBlur <= 0.0) {
        return texture(tex, texCoord);
    }
    
    vec4 result = vec4(0.0);
    int samples = 5;
    float weight = 1.0 / float(samples);
    
    for (int i = 0; i < samples; i++) {
        float offset = (float(i) - float(samples) * 0.5) * u_motionBlur * 0.01;
        vec2 sampleCoord = texCoord + vec2(offset, 0.0);
        result += texture(tex, sampleCoord) * weight;
    }
    
    return result;
}

/**
 * Apply trail thickness by sampling surrounding pixels
 */
float applyThickness(sampler2D mask, vec2 texCoord) {
    if (u_thickness <= 1.0) {
        return texture(mask, texCoord).r;
    }
    
    float result = 0.0;
    float radius = (u_thickness - 1.0) * 0.01;
    int samples = 9;
    
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            vec2 offset = vec2(float(x), float(y)) * radius;
            result = max(result, texture(mask, texCoord + offset).r);
        }
    }
    
    return result;
}

void main() {
    vec2 texCoord = v_texCoord;
    
    // Sample input textures
    vec4 currentFrame = sampleWithMotionBlur(u_currentFrame, texCoord);
    vec4 previousTrails = texture(u_previousTrails, texCoord);
    float ledMask = applyThickness(u_ledMask, texCoord);
    
    // Calculate trail decay
    float decay = 1.0 - u_fadeRate;
    vec4 fadedTrails = previousTrails * decay * u_trailLength;
    
    // Create new trail contribution from current frame
    vec4 newTrail = currentFrame * ledMask * u_opacity;
    
    // Apply color tint to new trails
    newTrail.rgb = mix(newTrail.rgb, newTrail.rgb * u_tint.rgb, u_tint.a);
    
    // Combine trails using blend mode
    vec3 combinedTrails = applyBlendMode(fadedTrails.rgb, newTrail.rgb, u_blendMode);
    
    // Calculate final alpha
    float finalAlpha = max(fadedTrails.a * decay, newTrail.a);
    
    // Output final color
    fragColor = vec4(combinedTrails, finalAlpha);
    
    // Ensure we don't exceed maximum brightness
    fragColor.rgb = min(fragColor.rgb, vec3(1.0));
}
