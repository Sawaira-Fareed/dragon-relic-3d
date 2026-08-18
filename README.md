# The Dragon Relic — 3D Character Showcase

**FE-AA2: Your First 3D Experience on the Web**

A scroll-driven, cinematic 3D dragon showcase built with React Three Fiber. The experience presents a GLB dragon model as a premium interactive character study — with scroll-based storytelling, material variants, and a drag-to-rotate inspection mode.

---

## Live URL

🔗 **[Deployed Experience URL]**

---

## What I Built

An interactive 3D character showcase featuring:

- **Scroll Mode (Default):** Vertical scrolling drives the dragon's movement, rotation, and position while revealing editorial story text section by section
- **Drag Mode:** Toggle to freely rotate and zoom the dragon using pointer controls
- **Three Material Variants:** DEFAULT (original GLB), FIRE (warm orange tint + glow), ICE (cool blue tint + glow)
- **Vortex Background:** 150 swirling particles (80 on mobile) that shift color based on the active variant
- **Cinematic Presentation:** Dark atmospheric environment, fog, elegant serif typography, scroll-reveal animations

---

## Assignment Requirements Checklist

| Requirement | How It's Fulfilled |
|-------------|-------------------|
| **Renders a real 3D scene** | React Three Fiber + Three.js with GLB model, lighting, fog, particles |
| **Meaningful interaction beyond orbiting** | Scroll-driven dragon movement + rotation, material variant switching, drag-to-rotate toggle mode |
| **Loads responsibly** | No shadows, DPR limited to 1.2, particle count reduced on mobile, procedural geometry |
| **Usable on mobile** | Touch controls, responsive layout, reduced particles and DPR on small screens |
| **FE-10 lens applied** | Performance documented below with load and frame rate notes |

---

## FE-10 Performance Note

### Lighthouse Scores

| Metric | Desktop | Mobile |
|--------|---------|--------|
| Performance | 53 | 40 |
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO | 82 | 82 |

### Bundle / Model Size

| Asset | Size |
|-------|------|
| GLB Model (uncompressed) | ~6.1 MB |
| React + Three.js + Drei (gzipped) | ~400 KB |
| Total Initial Load | ~6.5 MB (GLB dominates) |

### What I Did to Keep It Sane

1. **No shadows** — Removed all shadow casting/receiving to reduce GPU load
2. **DPR limiting** — `dpr={[1, 1.2]}` instead of 1.5-2x
3. **Particle optimization** — 150 particles desktop, 80 mobile (down from 500)
4. **Fog for depth** — Instead of expensive post-processing effects
5. **Simple materials** — `meshBasicMaterial` for particles, no PBR complexity on effects
6. **No post-processing** — No bloom, SSAO, or expensive shaders
7. **Passive scroll listener** — `{ passive: true }` for smooth scrolling

### Frame Rate (Observed)

| Device | Frame Rate |
|--------|-----------|
| Desktop (mid-range GPU) | 50-60 FPS |
| Mobile (mid-range phone) | 30-45 FPS |

### What I'd Add With More Time

1. **Draco compression** — Compress GLB from 6.1 MB to ~1 MB using `gltf-pipeline -d`
2. **Lazy loading** — Load Canvas only when user scrolls to it
3. **Code splitting** — Separate Three.js chunks via Vite `manualChunks`
4. **Static fallback** — 2D image/text fallback for non-WebGL browsers
5. **Reduced motion mode** — Disable animations for `prefers-reduced-motion`
6. **Service worker** — Cache GLB and assets for repeat visits

---

## Tech Stack

- React 18
- React Three Fiber 8
- Three.js
- Drei (OrbitControls, useGLTF)
- Vite
- Cormorant Garamond + Inter (Google Fonts)

---

## How to Run Locally

```bash
npm install
npm run dev