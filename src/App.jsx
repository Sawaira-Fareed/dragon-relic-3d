import { Canvas, useFrame } from "@react-three/fiber";
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
    tint: "#f0a060",
    glow: "#ffc080",
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
    tint: "#a0d8f0",
    glow: "#c8f0ff",
    story: {
      title: "Frozen Eternity",
      line1: "In the stillness of winter,",
      line2: "the dragon found its peace.",
      line3: "Crystal scales shimmer like frozen lakes,",
      line4: "cold and beautiful, forever.",
    },
  },
};

/* =========================================================
   VORTEX BACKGROUND — Optimized (150 particles)
========================================================= */

function VortexBackground({ variant }) {
  const groupRef = useRef();

  const particles = useMemo(() => {
    const isMobile = window.innerWidth < 700;
    const count = isMobile ? 80 : 150;
    const data = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 14;
      const height = (Math.random() - 0.5) * 18;

      data.push({
        angle,
        radius,
        height,
        speed: 0.1 + Math.random() * 0.5,
        size: Math.random() * 0.035 + 0.004,
        phase: Math.random() * Math.PI * 2,
        orbitSpeed: (Math.random() - 0.5) * 0.4,
      });
    }

    return data;
  }, []);

  const colors = useMemo(() => {
    if (variant === "fire") {
      return { r: 255, g: 120, b: 40 };
    } else if (variant === "ice") {
      return { r: 100, g: 200, b: 255 };
    }
    return { r: 180, g: 150, b: 220 };
  }, [variant]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.children.forEach((mesh, i) => {
      if (i >= particles.length) return;
      const p = particles[i];

      p.angle += delta * p.orbitSpeed;
      p.radius += Math.sin(t * p.speed + p.phase) * 0.002;
      p.height += Math.cos(t * p.speed * 0.5 + p.phase) * 0.003;

      const x = Math.cos(p.angle) * p.radius;
      const z = Math.sin(p.angle) * p.radius - 4;
      const y = p.height;

      mesh.position.set(x, y, z);

      const twinkle = Math.sin(t * p.speed + p.phase) * 0.3 + 0.7;
      mesh.material.opacity = twinkle * 0.5;

      const pulse = 1 + Math.sin(t * p.speed * 2 + p.phase) * 0.4;
      mesh.scale.setScalar(p.size * pulse);
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {particles.map((p, i) => (
        <mesh key={`vortex-bg-${i}`}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial
            color={`rgb(${colors.r}, ${colors.g}, ${colors.b})`}
            transparent
            opacity={0.3}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
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
      const xPos = fit.x - 5 + scrollProgress * 2;
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, xPos, 0.04);

      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        fit.y - 4 + Math.sin(t * 1.2) * 0.05,
        0.04
      );

      const targetRotation = scrollProgress * Math.PI * 1.5 + t * 0.03;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation, 0.03);
    } else {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, fit.x - 5, 0.04);

      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        fit.y - 4 + Math.sin(t * 1.2) * 0.05,
        0.04
      );
    }
  });

  return (
    <group ref={groupRef} position={[fit.x - 5, fit.y - 4, fit.z]} scale={fit.scale}>
      <primitive object={model} />

      {variant !== "default" && <pointLight color={theme.glow} intensity={1.5} distance={5} />}

      {variant !== "default" && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[1.8, 32, 32]} />
          <meshBasicMaterial
            color={theme.glow}
            transparent
            opacity={0.04}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
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
      <color attach="background" args={["#0d0d18"]} />
      <fog attach="fog" args={["#0d0d18", 10, 30]} />

      <ambientLight intensity={0.8} color="#e0d8e8" />
      <directionalLight position={[-5, 7, 6]} intensity={1.5} />
      <pointLight position={[3, 3, 4]} intensity={1} color={theme.glow} />

      <VortexBackground variant={variant} />
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
      <main className="scene">
        <Canvas
          dpr={[1, 1.2]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          camera={{ position: [0, 0, 11], fov: 35 }}
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