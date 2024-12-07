uniform vec2 uResolution;
uniform float uSize;
attribute vec3 aPositionTarget;
attribute float aSizes;
uniform float uMixFactor;
uniform vec3 uColorA;
uniform vec3 uColorB;
#include ../includes/simpleNoise.glsl
varying  vec3 vColor;

void main()
{
    float noiseOrigin = simplexNoise3d(position * 0.2);
    float noiseTarget = simplexNoise3d(aPositionTarget * 0.2);
    float noise = mix(noiseOrigin,noiseTarget,uMixFactor);
    noise = smoothstep(-1.0,1.0,noise);

    // delay and duration calculation
    float duration = 0.4;
    float delay = (1.0 - 0.4) * noise;
    float end = delay + duration;

    // Mixing positions
    float mixFactor = smoothstep(delay, end, uMixFactor);
    vec3 mixPositions = mix(position, aPositionTarget, mixFactor);

    // Final position
    vec4 modelPosition = modelMatrix * vec4(mixPositions, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Point size
    gl_PointSize = uSize * uResolution.y * aSizes;
    gl_PointSize *= (1.0 / - viewPosition.z);

    // update varying
    vColor = mix(uColorA,uColorB,noise);
}