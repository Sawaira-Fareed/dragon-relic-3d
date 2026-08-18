# FE-AA2: The Dragon Relic — 3D Character Showcase

## Live URL
https://sawaira-fareed.github.io/dragon-relic-3d/

## Repository
https://github.com/Sawaira-Fareed/dragon-relic-3d

## What I Built
An interactive 3D dragon showcase built with React Three Fiber featuring:
- Scroll-driven cinematic experience (scroll controls dragon movement & story text reveal)
- Drag-to-rotate inspection mode
- Three material variants: DEFAULT, FIRE, ICE
- Vortex particle background (150 desktop / 80 mobile)
- Responsive design with mobile touch support

## Assignment Requirements Fulfilled

| Requirement | Status |
|-------------|--------|
| Real 3D scene (R3F + Three.js) | ✅ |
| Meaningful interaction (scroll + drag + variants) | ✅ |
| Loads responsibly (no shadows, DPR 1.2, optimized particles) | ✅ |
| Mobile usable (touch + responsive) | ✅ |
| FE-10 lens applied | ✅ (documented in README) |

## FE-10 Performance Note

| Metric | Desktop | Mobile |
|--------|---------|--------|
| Lighthouse Performance | 53 | 40 |
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |

**Bundle Size:** ~323 KB gzipped (JS) + 6.1 MB GLB model
**Frame Rate:** 50-60 FPS desktop, 30-45 FPS mobile

**Optimizations:**
- No shadows (removed for GPU performance)
- DPR limited to 1.2
- Particles: 150 desktop / 80 mobile
- No post-processing effects
- Passive scroll listeners

**What I'd Add With More Time:**
- Draco compression for GLB (6.1 MB → ~1 MB)
- Lazy loading canvas
- Code splitting for Three.js
- Static 2D fallback for non-WebGL browsers

## Interactions
1. **Scroll** — Drives dragon movement, rotation, and story sections
2. **Toggle Button** — Switches between Scroll Mode and Drag Mode
3. **Drag** — Free 3D rotation and zoom (Drag Mode)
4. **Variant Buttons** — DEFAULT, FIRE, ICE material switching