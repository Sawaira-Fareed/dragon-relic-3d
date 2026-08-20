import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import "./App.css";

const VARIANTS = {
  default: {
    name: "DEFAULT",
    icon: "✦",
    tint: "#d4c8b8",
    glow: "#c8b090",
    story: {
      title: "The Ancient One",
      line1: "Before fire, before ice,",
      line2: "there was stone.",
      line3: "The dragon slumbers in its original form,",
      line4: "untouched by elemental magic.",
    },
  },
  fire: {
    name: "FIRE",
    icon: "🔥",
    tint: "#620603",
    glow: "#4a0305",
    story: {
      title: "Born of Embers",
      line1: "From the heart of the volcano,",
      line2: "it rises with burning breath.",
      line3: "Every scale holds the memory of flames,",
      line4: "eternal and untamed.",
    },
  },
  ice: {
    name: "ICE",
    icon: "❄️",
    tint: "#30b7ec",
    glow: "#4cbae2eb",
    story: {
      title: "Frozen Eternity",
      line1: "In the stillness of winter,",
      line2: "the dragon found its peace.",
      line3: "Crystal scales shimmer like frozen lakes,",
      line4: "cold and beautiful, forever.",
    },
  },
};

// Tweak these to reposition the dragon without touching the scroll logic.
const DRAGON_START_OFFSET = {
  x: -6.4,
  y: -4,
  z: 0,
};

// Swap this to "weave" if you want to roll back to the previous background.
const BACKGROUND_STYLE = "emergent";

const NETWORK_VERTEX_SHADER = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NETWORK_FRAGMENT_SHADER = `
  precision highp float;

  varying vec2 vUv;

  uniform float u_time;
  uniform vec2 u_mouse;
  uniform vec2 u_resolution;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  vec2 hash22(vec2 p) {
    float n = hash12(p);
    return vec2(n, hash12(p + n + 17.13));
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.03;
      amplitude *= 0.5;
    }

    return value;
  }

  float ribbon(vec2 p, float yBase, float amp, float freq, float speed, float width, float phase) {
    float warp = fbm(vec2(p.x * 1.3, p.y * 2.0) + vec2(phase, -phase) + u_time * 0.08);
    float curve = yBase
      + sin(p.x * freq + u_time * speed + phase) * amp
      + sin(p.x * (freq * 0.5) - u_time * (speed * 0.7) + phase * 1.7) * amp * 0.45
      + (warp - 0.5) * amp * 0.55;
    return smoothstep(width, 0.0, abs(p.y - curve));
  }

  vec3 strandColor(float index, float t) {
    vec3 violet = vec3(0.67, 0.24, 0.98);
    vec3 pink = vec3(0.96, 0.45, 0.95);
    vec3 blue = vec3(0.25, 0.62, 1.0);
    vec3 orange = vec3(1.0, 0.45, 0.18);
    float mixA = 0.5 + 0.5 * sin(index * 1.37 + t * 0.25);
    float mixB = 0.5 + 0.5 * sin(index * 2.11 - t * 0.18);
    vec3 c = mix(violet, pink, mixA);
    c = mix(c, blue, smoothstep(0.35, 0.95, mixB));
    c = mix(c, orange, smoothstep(0.65, 0.98, sin(index * 0.91 + t * 0.12) * 0.5 + 0.5));
    return c;
  }

  void main() {
    vec2 aspectUv = (vUv - 0.5) * vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
    vec2 p = aspectUv;
    vec2 mouse = (u_mouse * 0.38) * vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
    float mouseGlow = exp(-distance(p, mouse) * 2.4);

    float grain = hash12(gl_FragCoord.xy + u_time * 60.0);
    float baseNoise = fbm(p * 1.6 + vec2(u_time * 0.03, -u_time * 0.022));
    float deepNoise = fbm(p * 3.4 - vec2(u_time * 0.055, u_time * 0.04));

    vec3 skyBlossom = vec3(0.78, 0.56, 0.69);
    vec3 blossomLight = vec3(0.91, 0.74, 0.84);
    vec3 blossomDeep = vec3(0.30, 0.13, 0.34);
    vec3 inkRose = vec3(0.16, 0.08, 0.20);
    vec3 color = mix(inkRose, blossomDeep, smoothstep(-0.92, 0.35, p.y));
    color = mix(color, skyBlossom, smoothstep(-0.15, 1.0, p.x * 0.42 + p.y * 0.55 + 0.35));
    color = mix(color, blossomLight, smoothstep(0.15, 1.05, p.x + p.y * 0.3));
    color += vec3(0.08, 0.02, 0.09) * baseNoise * 0.22;
    color += vec3(0.04, 0.01, 0.06) * deepNoise * 0.18;
    color += vec3(0.10, 0.05, 0.12) * smoothstep(0.78, 0.1, length(p)) * 0.18;

    float ribbonGlow = 0.0;
    float lineStrength = 0.0;
    lineStrength += ribbon(p + vec2(-0.12, 0.18), 0.72, 0.26, 2.7, 0.35, 0.022, 0.4);
    lineStrength += ribbon(p + vec2(0.05, -0.1), 0.58, 0.22, 3.2, -0.28, 0.019, 1.6);
    lineStrength += ribbon(p + vec2(0.18, 0.03), 0.41, 0.2, 4.3, 0.24, 0.018, 2.9);
    lineStrength += ribbon(p + vec2(-0.2, -0.05), 0.14, 0.18, 5.2, -0.18, 0.017, 4.3);
    lineStrength += ribbon(vec2(p.y, p.x) + vec2(0.08, -0.12), -0.62, 0.24, 2.8, 0.31, 0.02, 0.9);
    lineStrength += ribbon(vec2(p.y, p.x) + vec2(-0.1, 0.16), -0.22, 0.22, 3.7, -0.29, 0.018, 2.2);
    lineStrength += ribbon(vec2(-p.y, p.x) + vec2(0.0, 0.12), 0.02, 0.2, 3.5, 0.26, 0.02, 3.7);
    lineStrength += ribbon(vec2(p.x, -p.y) + vec2(-0.08, -0.14), 0.28, 0.19, 4.5, -0.24, 0.017, 5.0);

    ribbonGlow = pow(lineStrength, 1.6);

    vec3 strandColor = vec3(0.72, 0.28, 0.98);
    strandColor = mix(strandColor, vec3(1.0, 0.44, 0.16), smoothstep(0.2, 0.85, baseNoise));
    strandColor = mix(strandColor, vec3(0.18, 0.56, 1.0), smoothstep(0.3, 0.98, deepNoise));
    color += strandColor * ribbonGlow * 2.5;
    color += vec3(1.0, 0.82, 0.55) * ribbonGlow * 0.45;
    color += vec3(1.0, 0.42, 0.18) * lineStrength * 0.18;

    float cellScale = 2.2;
    vec2 gv = p * cellScale + vec2(u_time * 0.05, -u_time * 0.035);
    vec2 id = floor(gv);
    vec2 f = fract(gv);
    float md1 = 8.0;
    float md2 = 8.0;

    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = hash22(id + g);
        o = 0.5 + 0.5 * sin(o * 6.2831 + vec2(0.0, 1.57) + u_time * vec2(0.08, -0.06));
        vec2 r = g + o - f;
        float d = dot(r, r);
        if (d < md1) {
          md2 = md1;
          md1 = d;
        } else if (d < md2) {
          md2 = d;
        }
      }
    }

    float cellFill = smoothstep(0.72, 0.0, md1);
    float cellEdge = smoothstep(0.1, 0.0, abs(sqrt(md2) - sqrt(md1)));
    vec3 cellColor = mix(vec3(0.42, 0.16, 0.65), vec3(0.9, 0.78, 1.0), baseNoise);
    color += cellColor * cellFill * 0.16;
    color += vec3(0.95, 0.7, 1.0) * cellEdge * 0.78;

    float shards = 0.0;
    for (int i = 0; i < 10; i++) {
      float fi = float(i);
      vec2 seed = hash22(vec2(fi, fi * 1.7));
      vec2 center = (seed * 2.0 - 1.0) * vec2(1.12, 0.7);
      center += vec2(sin(u_time * 0.13 + fi) * 0.14, cos(u_time * 0.11 + fi * 1.3) * 0.1);
      float poly = smoothstep(0.18, 0.0, distance(p, center));
      poly *= smoothstep(0.33, 0.1, abs(dot(normalize(p - center), vec2(0.72, 0.69))));
      shards += poly;
    }
    color += vec3(0.8, 0.88, 1.0) * shards * 0.1;
    color += vec3(0.98, 0.44, 0.92) * shards * 0.04;

    float sparks = 0.0;
    for (int i = 0; i < 22; i++) {
      float fi = float(i);
      vec2 sp = vec2(
        sin(fi * 13.7 + u_time * (0.8 + mod(fi, 3.0) * 0.12)),
        cos(fi * 9.1 - u_time * (0.7 + mod(fi, 4.0) * 0.09))
      );
      sp *= vec2(1.12, 0.9);
      sp += vec2(sin(u_time * 0.21 + fi) * 0.08, cos(u_time * 0.17 + fi * 0.4) * 0.05);
      float s = smoothstep(0.04, 0.0, distance(p, sp));
      sparks += s;
    }
    color += vec3(1.0, 0.54, 0.2) * sparks * 0.52;
    color += vec3(0.9, 0.72, 1.0) * sparks * 0.22;

    float centerGlow = exp(-length(p) * 2.2);
    color += vec3(0.22, 0.08, 0.3) * centerGlow * 0.35;
    color += vec3(1.0, 0.66, 0.82) * mouseGlow * 0.28;
    color += vec3(0.82, 0.45, 1.0) * mouseGlow * 0.14;

    color += (grain - 0.5) * 0.03;
    color = clamp(color, 0.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function NeonWeaveBackground() {
  const meshRef = useRef();
  const materialRef = useRef();
  const { size, mouse } = useThree();

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.u_time.value = state.clock.elapsedTime;
    materialRef.current.uniforms.u_mouse.value.set(mouse.x, mouse.y);
    materialRef.current.uniforms.u_resolution.value.set(size.width, size.height);
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -30]} scale={[120, 120, 1]} renderOrder={-20}>
      <planeGeometry args={[2, 2, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={{
          u_time: { value: 0 },
          u_mouse: { value: new THREE.Vector2() },
          u_resolution: { value: new THREE.Vector2(1, 1) },
        }}
        vertexShader={NETWORK_VERTEX_SHADER}
        fragmentShader={NETWORK_FRAGMENT_SHADER}
        depthWrite={false}
        depthTest={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

const EMERGENT_VERTEX_SHADER = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const EMERGENT_FRAGMENT_SHADER = `
  precision highp float;

  varying vec2 vUv;

  uniform float u_time;
  uniform vec2 u_mouse;
  uniform vec2 u_resolution;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  vec2 hash22(vec2 p) {
    float n = hash12(p);
    return vec2(n, hash12(p + n + 17.13));
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
  }

  vec3 particlePalette(float t) {
    vec3 magenta = vec3(0.92, 0.34, 0.68);
    vec3 blue = vec3(0.23, 0.58, 1.0);
    vec3 gold = vec3(1.0, 0.78, 0.26);
    vec3 violet = vec3(0.6, 0.28, 0.95);
    vec3 c = mix(magenta, blue, smoothstep(0.15, 0.95, t));
    c = mix(c, gold, smoothstep(0.55, 0.98, sin(t * 5.2) * 0.5 + 0.5) * 0.25);
    c = mix(c, violet, smoothstep(0.25, 0.85, cos(t * 4.3) * 0.5 + 0.5));
    return c;
  }

  vec2 particlePos(vec2 cell, vec2 dims) {
    vec2 seed = cell + vec2(13.7, 4.2);
    vec2 jitter = hash22(seed) - 0.5;
    vec2 base = (cell + 0.5 + jitter * 0.7) / dims * 2.0 - 1.0;
    base.x *= dims.x / max(dims.y, 1.0);

    float phase = hash12(seed + 11.3) * 6.28318;
    vec2 drift = vec2(
      sin(u_time * 0.26 + phase + cell.y * 0.7),
      cos(u_time * 0.22 + phase + cell.x * 0.6)
    ) * 0.08;

    vec2 mouse = u_mouse * 0.4;
    float mouseDist = distance(base, mouse);
    vec2 mousePull = normalize(mouse - base + 0.0001) * exp(-mouseDist * 2.6) * 0.12;

    return base + drift + mousePull;
  }

  void main() {
    vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
    vec2 p = (vUv - 0.5) * 2.0 * aspect;
    vec2 mouse = u_mouse * 0.55;
    mouse.x *= aspect.x;

    float grain = hash12(gl_FragCoord.xy + u_time * 60.0);
    float nebula = fbm(p * 1.2 + vec2(u_time * 0.03, -u_time * 0.022));
    float deepNebula = fbm(p * 2.7 - vec2(u_time * 0.04, u_time * 0.03));

    vec3 bgDark = vec3(0.025, 0.03, 0.08);
    vec3 bgMid = vec3(0.08, 0.11, 0.23);
    vec3 bgLight = vec3(0.18, 0.15, 0.34);
    vec3 color = mix(bgDark, bgMid, smoothstep(-0.9, 0.85, p.y));
    color = mix(color, bgLight, smoothstep(0.15, 1.1, p.x * 0.3 + p.y * 0.5 + 0.25));
    color += vec3(0.12, 0.07, 0.2) * nebula * 0.28;
    color += vec3(0.05, 0.1, 0.2) * deepNebula * 0.24;
    color += vec3(0.03, 0.05, 0.1) * smoothstep(1.25, 0.0, length(p));
    color += vec3(0.07, 0.1, 0.22) * smoothstep(1.6, 0.0, distance(p, vec2(-1.08, -1.06))) * 0.9;
    color += vec3(0.26, 0.12, 0.4) * smoothstep(1.4, 0.0, distance(p, vec2(-1.08, -1.06))) * 0.45;

    const int COLS = 8;
    const int ROWS = 6;
    vec2 dims = vec2(float(COLS), float(ROWS));
    float orbGlow = 0.0;
    float webGlow = 0.0;

    for (int i = 0; i < COLS * ROWS; i++) {
      float fi = float(i);
      vec2 cell = vec2(mod(fi, float(COLS)), floor(fi / float(COLS)));
      vec2 pos = particlePos(cell, dims);
      float seed = hash12(cell + vec2(4.7, 9.1));
      float size = mix(0.015, 0.05, hash12(cell + vec2(1.9, 3.3)));
      float d = distance(p, pos);
      float core = exp(-d * d / (size * size * 0.28));
      float aura = exp(-d * d / (size * size * 2.6));
      vec3 pc = particlePalette(seed);

      orbGlow += core;
      color += pc * core * 0.46;
      color += pc * aura * 0.16;

      if (cell.x < float(COLS - 1)) {
        vec2 rightPos = particlePos(cell + vec2(1.0, 0.0), dims);
        float line = exp(-pow(sdSegment(p, pos, rightPos) / 0.014, 2.0));
        webGlow += line * 0.8;
      }

      if (cell.y < float(ROWS - 1)) {
        vec2 downPos = particlePos(cell + vec2(0.0, 1.0), dims);
        float line = exp(-pow(sdSegment(p, pos, downPos) / 0.013, 2.0));
        webGlow += line * 0.75;
      }
    }

    color += vec3(0.46, 0.56, 1.0) * webGlow * 0.16;
    color += vec3(0.92, 0.38, 0.66) * webGlow * 0.12;
    color += vec3(1.0, 0.76, 0.28) * orbGlow * 0.08;

    float starburst = exp(-pow(length(p - vec2(0.12, -0.04)) * 1.7, 2.0));
    color += vec3(0.55, 0.32, 1.0) * starburst * 0.2;
    color += vec3(0.96, 0.7, 0.86) * starburst * 0.1;

    float centerFalloff = smoothstep(1.5, 0.2, length(p));
    color *= mix(0.78, 1.0, centerFalloff);

    float mouseGlow = exp(-distance(p, mouse) * 2.2);
    color += vec3(0.9, 0.68, 1.0) * mouseGlow * 0.2;
    color += vec3(0.2, 0.5, 1.0) * mouseGlow * 0.11;

    color += (grain - 0.5) * 0.03;
    color = clamp(color, 0.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function EmergentParticlesBackground() {
  const meshRef = useRef();
  const materialRef = useRef();
  const { camera, viewport, size, mouse } = useThree();

  useEffect(() => {
    if (!meshRef.current) return;
    const vp = viewport.getCurrentViewport(camera, new THREE.Vector3(0, 0, 0));
    meshRef.current.scale.set(vp.width, vp.height, 1);
    meshRef.current.position.set(0, 0, 0);
  }, [camera, viewport, size.width, size.height]);

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.u_time.value = state.clock.elapsedTime;
    materialRef.current.uniforms.u_mouse.value.set(mouse.x, mouse.y);
    materialRef.current.uniforms.u_resolution.value.set(size.width, size.height);
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} renderOrder={-20} frustumCulled={false}>
      <planeGeometry args={[2, 2, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={{
          u_time: { value: 0 },
          u_mouse: { value: new THREE.Vector2() },
          u_resolution: { value: new THREE.Vector2(1, 1) },
        }}
        vertexShader={EMERGENT_VERTEX_SHADER}
        fragmentShader={EMERGENT_FRAGMENT_SHADER}
        depthWrite={false}
        depthTest={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

function BackgroundLayer() {
  return BACKGROUND_STYLE === "weave" ? <NeonWeaveBackground /> : <EmergentParticlesBackground />;
}

function BackgroundStage({ isTabVisible }) {
  return (
    <div className="shader-layer" aria-hidden="true">
      <Canvas
        orthographic
        dpr={[1, 1.25]}
        gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
        camera={{ position: [0, 0, 1], zoom: 1 }}
        frameloop={isTabVisible ? "always" : "never"}
      >
        <Suspense fallback={null}>
          <BackgroundLayer />
        </Suspense>
      </Canvas>
    </div>
  );
}

/* =========================================================
   DRAGON MODEL — No Shadows, Optimized
========================================================= */

function DragonModel({ variant, scrollProgress, mode }) {
  const { scene } = useGLTF("/models/dragon.glb");
  const groupRef = useRef();
  const theme = VARIANTS[variant];

  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = false;
      child.receiveShadow = false;
      if (child.material) {
        child.material = child.material.clone();
        if (child.material.color) {
          child.material.userData.originalColor = child.material.color.clone();
        }
      }
    });
    return clone;
  }, [scene]);

  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const desiredHeight = 3.5;
    const scale = desiredHeight / Math.max(size.y, 0.001);

    return {
      scale,
      x: -center.x * scale,
      y: -box.min.y * scale,
      z: -center.z * scale,
    };
  }, [model]);

  useEffect(() => {
    model.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const material = child.material;
      const name = child.name.toLowerCase();
      const original = material.userData.originalColor?.clone() || new THREE.Color("#d4c8b8");

      if (name.includes("eye") || name.includes("teeth") || name.includes("tooth") || name.includes("claw")) {
        material.color.copy(original);
        if (material.emissive) material.emissive.set("#000000");
        material.emissiveIntensity = 0;
        return;
      }

      if (variant === "default") {
        material.color.copy(original);
        if (material.emissive) material.emissive.set("#000000");
        material.emissiveIntensity = 0;
        material.roughness = 0.65;
        return;
      }

      const tint = new THREE.Color(theme.tint);
      const strength = name.includes("wing") ? 0.5 : name.includes("horn") || name.includes("spine") || name.includes("crest") ? 0.3 : 0.38;

      material.color.copy(original).lerp(tint, strength);
      material.roughness = 0.5;

      if (material.emissive) {
        material.emissive.set(theme.glow);
        material.emissiveIntensity = 0.22;
      }
    });
  }, [model, variant, theme]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    const breathe = 1 + Math.sin(t * 1.1) * 0.012;
    groupRef.current.scale.setScalar(fit.scale * breathe);

    if (mode === "scroll") {
      const xPos = fit.x + DRAGON_START_OFFSET.x + scrollProgress * 2;
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, xPos, 0.04);

      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        fit.y + DRAGON_START_OFFSET.y + Math.sin(t * 1.2) * 0.05,
        0.04
      );

      const targetRotation = scrollProgress * Math.PI * 1.5 + t * 0.03;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation, 0.03);
    } else {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, fit.x + DRAGON_START_OFFSET.x, 0.04);

      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        fit.y + DRAGON_START_OFFSET.y + Math.sin(t * 1.2) * 0.05,
        0.04
      );
    }
  });

  return (
    <group ref={groupRef} position={[fit.x + DRAGON_START_OFFSET.x, fit.y + DRAGON_START_OFFSET.y, fit.z + DRAGON_START_OFFSET.z]} scale={fit.scale}>
      <primitive object={model} />
    </group>
  );
}

/* =========================================================
   SCENE
========================================================= */

function Scene({ variant, scrollProgress, mode }) {
  const theme = VARIANTS[variant];

  return (
    <>
      <fog attach="fog" args={["#050816", 14, 34]} />

      <ambientLight intensity={0.32} color="#f3e4ee" />
      <directionalLight position={[-5, 7, 6]} intensity={0.95} color="#ffdff1" />
      <pointLight position={[0, 0.5, 3]} intensity={1.0} color={theme.glow} />

      <DragonModel variant={variant} scrollProgress={scrollProgress} mode={mode} />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={mode === "drag"}
        enableRotate={mode === "drag"}
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={15}
        target={[-4, -3.5, 0]}
        rotateSpeed={0.8}
        zoomSpeed={1}
      />
    </>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [variant, setVariant] = useState("default");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [mode, setMode] = useState("scroll");
  const [isTabVisible, setIsTabVisible] = useState(() => !document.hidden);

  const theme = VARIANTS[variant];

  useEffect(() => {
    if (mode === "drag") {
      document.body.classList.add("scroll-lock");
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.classList.remove("scroll-lock");
      document.documentElement.style.overflow = "auto";
    }
  }, [mode]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    handleVisibilityChange();

    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (mode !== "scroll") return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(Math.max(scrollY / Math.max(totalHeight, 1), 0), 1);
      setScrollProgress(progress);

      const sections = document.querySelectorAll(".section");
      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.4) {
          setCurrentSection(index);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mode]);

  const toggleMode = () => {
    if (mode === "scroll") {
      setMode("drag");
      setScrollProgress(0);
      window.scrollTo({ top: 0 });
    } else {
      setMode("scroll");
      window.scrollTo({ top: 0 });
    }
  };

  return (
    <div className="app">
      <BackgroundStage isTabVisible={isTabVisible} />

      <main className="scene">
        <Canvas
          dpr={[1, 1.2]}
          gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
          camera={{ position: [0, 0, 11], fov: 35 }}
          frameloop={isTabVisible ? "always" : "never"}
        >
          <Suspense fallback={null}>
            <Scene variant={variant} scrollProgress={scrollProgress} mode={mode} />
          </Suspense>
        </Canvas>
      </main>

      <div className="overlay">
        <header className="top-header">
          <div>
            <div className="eyebrow">3D CHARACTER STUDY</div>
            <h1>THE DRAGON</h1>
          </div>
          <div className="header-right">
            <div className="variant-badge">
              <span>{theme.icon}</span>
              {theme.name}
            </div>
            <button className="mode-toggle" onClick={toggleMode}>
              {mode === "scroll" ? "🖐️ DRAG MODE" : "📜 SCROLL MODE"}
            </button>
          </div>
        </header>

        <div className="variant-switcher">
          {Object.entries(VARIANTS).map(([key, item]) => (
            <button
              key={key}
              className={`variant-btn ${variant === key ? "active" : ""}`}
              onClick={() => setVariant(key)}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </div>

        {mode === "scroll" && (
          <div className="sections-container">
            <section className={`section hero ${currentSection === 0 ? "visible" : ""}`}>
              <div className="story-text">
                <h2>A creature shaped by form,</h2>
                <h2>light, and motion.</h2>
                <p className="subtitle">Scroll to explore</p>
              </div>
            </section>

            <section className={`section ${currentSection === 1 ? "visible" : ""}`}>
              <div className="story-text">
                <p className="label">FORM & DETAIL</p>
                <h3>Every surface is built around silhouette, proportion, and controlled detail.</h3>
              </div>
            </section>

            <section className={`section ${currentSection === 2 ? "visible" : ""}`}>
              <div className="story-text">
                <h2>{theme.story.title}</h2>
                <p>{theme.story.line1}</p>
                <p>{theme.story.line2}</p>
              </div>
            </section>

            <section className={`section ${currentSection === 3 ? "visible" : ""}`}>
              <div className="story-text">
                <p className="label">SURFACE</p>
                <h3>Light reveals what geometry alone cannot.</h3>
                <p>{theme.story.line3}</p>
                <p>{theme.story.line4}</p>
              </div>
            </section>

            <section className={`section ${currentSection === 4 ? "visible" : ""}`}>
              <div className="story-text">
                <p className="label">BUILT TO BE SEEN</p>
                <h3>A study in silhouette, material, light, and motion.</h3>
              </div>
            </section>

            <section className={`section ${currentSection === 5 ? "visible" : ""}`}>
              <div className="story-text">
                <h2>Explore every angle</h2>
                <p className="subtitle">Scroll to continue · Or switch to Drag Mode</p>
              </div>
            </section>
          </div>
        )}

        {mode === "drag" && (
          <div className="drag-hint">
            <p>🖱️ Drag to rotate · Scroll to zoom</p>
            <p className="drag-sub">Switch back to Scroll Mode for the cinematic experience</p>
          </div>
        )}
      </div>
    </div>
  );
}

useGLTF.preload("/models/dragon.glb");
