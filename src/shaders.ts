export const vertexShader = `
  uniform float uTime;
  uniform float uProgress; // 0.0 = CHAOS, 1.0 = FORMED
  uniform float uBeat; // Audio Reactivity
  
  attribute vec3 aRandomPosition;
  attribute vec3 aHeartPosition;
  attribute float aSize;
  attribute float aSpeed;
  
  varying vec3 vColor;
  
  // Custom easing function
  float cubicBezier(float t, float p0, float p1, float p2, float p3) {
    float u = 1.0 - t;
    float tt = t * t;
    float uu = u * u;
    float uuu = uu * u;
    float ttt = tt * t;
    return uuu * p0 + 3.0 * uu * t * p1 + 3.0 * u * tt * p2 + ttt * p3;
  }

  void main() {
    // Interpolate positions
    // Add some noise/curl based on time for the 'Chaos' state
    vec3 chaosPos = aRandomPosition + vec3(
      sin(uTime * aSpeed + aRandomPosition.x) * 0.5,
      cos(uTime * aSpeed + aRandomPosition.y) * 0.5,
      sin(uTime * aSpeed + aRandomPosition.z) * 0.5
    );

    // Heart state: tighter, organized
    vec3 heartPos = aHeartPosition;
    
    // Audio Reactivity: Expansion
    float heatExpansion = 1.0 + uBeat * 0.3; // Expand heart by up to 30%
    heartPos *= heatExpansion;

    // Smooth transition
    vec3 pos = mix(chaosPos, heartPos, uProgress);

    // Additional audio pulse on individual particle displacement (Explosion effect on beat)
    if (uProgress > 0.8) {
       pos += normalize(pos) * uBeat * aSpeed * 2.0;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation
    // Audio Reactivity: Size
    float sizePulse = 1.0 + uBeat * 2.0;
    gl_PointSize = aSize * (300.0 / -mvPosition.z) * sizePulse;

    // Color variation
    // Deep Ruby Red to Rose Gold
    vec3 ruby = vec3(0.6, 0.07, 0.12);
    vec3 roseGold = vec3(1.0, 0.6, 0.7); 
    
    // Mix based on position to give depth
    float mixFactor = (pos.y + 5.0) / 10.0;
    vColor = mix(ruby, roseGold, mixFactor * 0.5 + 0.2);
    
    // Brighten on beat
    vColor += vec3(0.1) * uProgress + vec3(uBeat * 0.5); 
  }
`

export const fragmentShader = `
  varying vec3 vColor;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    // Soft glow
    float str = 1.0 - (d * 2.0);
    str = pow(str, 2.0);

    gl_FragColor = vec4(vColor, str);
  }
`
