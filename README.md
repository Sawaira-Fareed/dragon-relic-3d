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
# FE-AA3: Signature Hero

## Live URL
https://dragon-relic-3d.vercel.app/
## Repository
https://github.com/Sawaira-Fareed/dragon-relic-3d

## What This Assignment Adds
This version turns the project into a signature hero experience with a custom GLSL background shader and a separate 3D dragon scene layered on top. The shader is rendered in its own fullscreen orthographic canvas so the effect stays consistent across the entire screen, including the bottom-left corner.

## Assignment Requirements

| Requirement | Status |
|-------------|--------|
| Custom/remixed fragment shader (GLSL) | ✅ |
| Fullscreen hero with real content on top | ✅ |
| At least 2 of 3 uniforms (`u_time`, `u_resolution`, `u_mouse`) | ✅ |
| Text readable with contrast | ✅ |
| `devicePixelRatio` capped | ✅ |
| Animation pauses when tab is hidden | ❌ Not implemented yet |
| `prefers-reduced-motion` fallback | ✅ |
| Shader explained in comments/README | ✅ |
| Live URL | ✅ |

## Shader Source
The shader code is defined in [src/App.jsx](src/App.jsx) inside the background shader components.

It uses:
- `u_time` for animation timing
- `u_resolution` for screen-aware scaling
- `u_mouse` for pointer interaction

Visual goals used in the current code:
- sky blossom and midnight rose gradients
- glowing ribbon-like strands
- soft spark points
- grain and atmospheric depth
- enough contrast for white text and the dragon to remain readable

## Performance Notes
- `devicePixelRatio` is capped in the canvases
- The shader is isolated in its own fullscreen layer, not mixed with the dragon camera
- `prefers-reduced-motion` falls back to a static background style
- The current code does not yet pause animation on `visibilitychange`; that is the one remaining performance item if the assignment requires it

## What I Changed in This Remix
- Original idea: an interactive dragon showcase
- Remix direction: a signature hero background built from a custom shader with the dragon as the center focus
- Added: full-screen background consistency, mouse-reactive glow, grain, and a lighter readable atmosphere
- Kept: scroll reveal, drag mode, and variant switching

## How to Run
```bash
npm install
npm run dev
```

## Submission Checklist
1. Push the repository to GitHub
2. Deploy the project to GitHub Pages, Vercel, or Netlify
3. Include this README in the submission
4. Submit the live URL
5. Submit the shader source reference from `src/App.jsx`
