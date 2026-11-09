export const TOPO_VERTEX_SHADER = `
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vElevation;

  void main() {
    vElevation = position.y;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const TOPO_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uIsLight;
  uniform float uFloodLevel;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vElevation;

  void main() {
    if (vElevation < 0.135) discard;

    float h = clamp((vElevation - 0.14) / 1.35, 0.0, 1.0);
    vec3 lightDir = normalize(vec3(0.6, 1.0, 0.5));
    float diff = clamp(dot(vNormal, lightDir), 0.0, 1.0);

    float contourFreq = 22.0;
    float cVal = fract(vElevation * contourFreq);
    float cLine = smoothstep(0.06, 0.015, abs(cVal - 0.5));

    float majorVal = fract(vElevation * (contourFreq / 4.0));
    float majorLine = smoothstep(0.035, 0.008, abs(majorVal - 0.5));

    float gridX = smoothstep(0.975, 0.996, cos(vWorldPos.x * 8.0));
    float gridZ = smoothstep(0.975, 0.996, cos(vWorldPos.z * 8.0));
    float microGrid = max(gridX, gridZ) * 0.11;

    float scanWave = smoothstep(0.35, 0.0, abs(fract(vWorldPos.z * 0.12 - uTime * 0.16) - 0.5));

    vec3 col;
    if (uIsLight > 0.5) {
      vec3 baseLow = vec3(0.93, 0.93, 0.94);
      vec3 baseHigh = vec3(0.74, 0.74, 0.77);
      col = mix(baseLow, baseHigh, h * 0.7 + (1.0 - diff) * 0.3);
      col = mix(col, vec3(0.36, 0.36, 0.40), cLine * 0.45);
      col = mix(col, vec3(0.08, 0.08, 0.10), majorLine * 0.85);
      col -= vec3(microGrid * 0.25);
    } else {
      vec3 baseLow = vec3(0.07, 0.07, 0.08);
      vec3 baseHigh = vec3(0.25, 0.25, 0.28);
      col = mix(baseLow, baseHigh, h * 0.75 + diff * 0.25);
      col += vec3(cLine * 0.18);
      col += vec3(majorLine * 0.48);
      col += vec3(microGrid);
      col += vec3(scanWave * 0.08);
    }

    if (uFloodLevel > 0.145 && vElevation <= uFloodLevel) {
      col = mix(col, vec3(0.93, 0.15, 0.22), 0.58);
    }

    gl_FragColor = vec4(col, 0.98);
  }
`;
