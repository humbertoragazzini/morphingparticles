uniform vec2 uResolution;
uniform float uSize;
attribute vec3 aPositionTarget;
uniform float mixFactor;

void main()
{

    // Mixing positions
    vec3 mixPositions = mix(position, aPositionTarget, mixFactor);

    // Final position
    vec4 modelPosition = modelMatrix * vec4(mixPositions, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Point size
    gl_PointSize = uSize * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);
}