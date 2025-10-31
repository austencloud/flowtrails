#version 300 es
precision highp float;

// Input texture (video frame)
uniform sampler2D u_inputTexture;

// Detection parameters
uniform float u_threshold;        // Brightness threshold (0.0 - 1.0)
uniform float u_sensitivity;      // Sensitivity multiplier (0.0 - 2.0)
uniform vec3 u_colorWeights;      // RGB weights for luminance calculation

// Texture coordinates
in vec2 v_texCoord;

// Output
out vec4 fragColor;

/**
 * Calculate luminance from RGB using weighted average
 * Standard weights: R=0.299, G=0.587, B=0.114
 */
float calculateLuminance(vec3 color) {
    return dot(color, u_colorWeights);
}

/**
 * Apply brightness threshold detection
 */
float detectBrightness(vec3 color) {
    float luminance = calculateLuminance(color);
    
    // Apply sensitivity multiplier
    float adjustedLuminance = luminance * u_sensitivity;
    
    // Threshold detection with smooth falloff
    float detection = smoothstep(u_threshold - 0.1, u_threshold + 0.1, adjustedLuminance);
    
    return detection;
}

/**
 * Enhanced LED detection with area filtering
 */
float enhancedDetection(vec2 texCoord) {
    vec3 centerColor = texture(u_inputTexture, texCoord).rgb;
    float centerDetection = detectBrightness(centerColor);
    
    // If center pixel is not bright enough, early exit
    if (centerDetection < 0.1) {
        return 0.0;
    }
    
    // Sample surrounding pixels for area detection
    float texelSize = 1.0 / 512.0; // Adjust based on texture resolution
    float surroundingBrightness = 0.0;
    int samples = 0;
    
    // 3x3 kernel sampling
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            vec3 sampleColor = texture(u_inputTexture, texCoord + offset).rgb;
            surroundingBrightness += detectBrightness(sampleColor);
            samples++;
        }
    }
    
    float averageBrightness = surroundingBrightness / float(samples);
    
    // Combine center detection with surrounding area
    return mix(centerDetection, averageBrightness, 0.3);
}

void main() {
    vec2 texCoord = v_texCoord;
    
    // Get original color
    vec4 originalColor = texture(u_inputTexture, texCoord);
    
    // Perform LED detection
    float detection = enhancedDetection(texCoord);
    
    // Output format:
    // R: Detection mask (0.0 = no LED, 1.0 = LED detected)
    // G: Original luminance
    // B: Detection strength
    // A: Original alpha
    
    float luminance = calculateLuminance(originalColor.rgb);
    
    fragColor = vec4(
        detection,           // Red: Binary detection mask
        luminance,          // Green: Original luminance
        detection * luminance, // Blue: Weighted detection
        originalColor.a     // Alpha: Preserve original
    );
}
