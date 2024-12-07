uniform vec2 uResolution;
uniform float uSize;
attribute vec3 aPositionTarget;
uniform float uMixFactor;
#include ../includes/simpleNoise.glsl
varying  vec3 vColor;

void main()
{

    float noise = simplexNoise3d(position);
    // Mixing positions
    float mixFactor = uMixFactor;
    vec3 mixPositions = mix(position, aPositionTarget, mixFactor);
    noise = smoothstep(-1.0,1.0,noise);

    // Final position
    vec4 modelPosition = modelMatrix * vec4(mixPositions, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Point size
    gl_PointSize = uSize * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);

    // update varying
    vColor = vec3(noise);
}