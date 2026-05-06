export default class AstralProjectionVisionFilter extends foundry.canvas.rendering.filters.AbstractBaseFilter {
  static override defaultUniforms = {
    alphaThreshold: 0.1,
    auraStrength: 0.6,
    auraTintA: [0.56, 0.45, 0.95],
    auraTintB: [0.76, 0.98, 1.0],
    pulsarEnabled: 1.0,
    pulseSpeed: 3.4,
    pulseDepth: 0.35,
    time: 0.0,
  };

  static override fragmentShader = `
  varying vec2 vTextureCoord;
  uniform sampler2D uSampler;
  uniform float alphaThreshold;
  uniform float auraStrength;
  uniform vec3 auraTintA;
  uniform vec3 auraTintB;
  uniform float pulsarEnabled;
  uniform float pulseSpeed;
  uniform float pulseDepth;
  uniform float time;

  void main(void) {
    vec4 texColor = texture2D(uSampler, vTextureCoord);
    if (texColor.a <= alphaThreshold) {
      gl_FragColor = vec4(0.0);
      return;
    }

    float luminance = dot(vec3(0.30, 0.59, 0.11), texColor.rgb);
    vec3 auraColor = mix(auraTintA, auraTintB, clamp(luminance * 1.25, 0.0, 1.0));

    vec2 centered = vTextureCoord - vec2(0.5);
    float distanceFromCenter = length(centered);
    float outerHalo = smoothstep(0.90, 0.35, distanceFromCenter);
    float innerCut = smoothstep(0.45, 0.20, distanceFromCenter);
    float halo = max(outerHalo - innerCut, 0.0);

    float pulseWave = 0.5 + 0.5 * sin((time * pulseSpeed) + (distanceFromCenter * 20.0));
    float pulseMix = mix(1.0, (1.0 - pulseDepth) + (pulseWave * (pulseDepth * 2.0)), pulsarEnabled);
    float auraMix = clamp(auraStrength * pulseMix, 0.0, 1.0);
    float haloMix = 0.25 * pulseMix;

    vec3 highlighted = mix(texColor.rgb, auraColor, auraMix);
    highlighted += auraColor * halo * haloMix;
    gl_FragColor = vec4(clamp(highlighted, 0.0, 1.0), texColor.a);
  }`;

  override apply(
    filterManager: any,
    input: any,
    output: any,
    clearMode: any,
    currentState: any
  ) {
    this.uniforms.time = performance.now() / 1000;
    super.apply(filterManager, input, output, clearMode, currentState);
  }
}
