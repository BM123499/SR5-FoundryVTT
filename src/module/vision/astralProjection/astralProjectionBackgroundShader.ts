export default class AstralProjectionBackgroundVisionShader extends foundry.canvas.rendering.shaders.BackgroundVisionShader {
    static COLOR_TINT = [0.92, 0.94, 1.0];

    static override fragmentShader = `
    ${this.SHADER_HEADER}
    ${this.PERCEIVED_BRIGHTNESS}

    void main() {
      ${this.FRAGMENT_BEGIN}

      const float BLUR_STRENGTH = 1.75;
      const float DESATURATION = 0.55;
      const float CONTRAST = -0.12;
      const float BRIGHTNESS = 0.10;
      const float TINT_STRENGTH = 0.20;

      vec2 stepSize = (vec2(1.0) / screenDimensions) * BLUR_STRENGTH;
      vec3 blurred = baseColor.rgb * 0.20;
      blurred += texture2D(primaryTexture, vSamplerUvs + vec2(stepSize.x, 0.0)).rgb * 0.12;
      blurred += texture2D(primaryTexture, vSamplerUvs - vec2(stepSize.x, 0.0)).rgb * 0.12;
      blurred += texture2D(primaryTexture, vSamplerUvs + vec2(0.0, stepSize.y)).rgb * 0.12;
      blurred += texture2D(primaryTexture, vSamplerUvs - vec2(0.0, stepSize.y)).rgb * 0.12;
      blurred += texture2D(primaryTexture, vSamplerUvs + stepSize).rgb * 0.08;
      blurred += texture2D(primaryTexture, vSamplerUvs - stepSize).rgb * 0.08;
      blurred += texture2D(primaryTexture, vSamplerUvs + vec2(stepSize.x, -stepSize.y)).rgb * 0.08;
      blurred += texture2D(primaryTexture, vSamplerUvs + vec2(-stepSize.x, stepSize.y)).rgb * 0.08;

      float luminance = perceivedBrightness(blurred);
      vec3 muted = mix(blurred, vec3(luminance), DESATURATION);
      vec3 adjusted = (muted - 0.5) * (1.0 + CONTRAST) + 0.5;
      adjusted *= (1.0 + BRIGHTNESS);
      finalColor = mix(adjusted, adjusted * colorTint, TINT_STRENGTH);
      finalColor = clamp(finalColor, vec3(0.0), vec3(1.0));

      ${this.ADJUSTMENTS}
      ${this.BACKGROUND_TECHNIQUES}
      ${this.FALLOFF}
      ${this.FRAGMENT_END}
    }`;

    static override defaultUniforms = {
        ...super.defaultUniforms,
        colorTint: this.COLOR_TINT,
    };

    override get isRequired() {
        return true;
    }
}
  
