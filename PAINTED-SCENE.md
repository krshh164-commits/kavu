# Painted background

Run `npm run dev -- --port 4173` to reopen. Build: `npm run build`.
Renderer: `src/painted-world.ts`. Shaders: `src/painted-shaders.ts`.
Assets: `public/assets/painted/`. `exact-canvas.png` is a byte-identical copy of the user's `dont change anything.png` (SHA256 F68953685A3EB066529651089BF6E7D0901A1E577C3EFAF2CFE927FC2282DEF8). The existing cloud and heron textures remain. Two smaller clouds use different silhouette warps and independent drift, moving shadows and animated edge grain.

Water uses a colour mask eroded at banks, traced river tangents, two staggered scrolling texture cycles and circular pond sampling. Land is sampled unchanged. Preview: http://127.0.0.1:4174/.

Drag to explore; wheel/pinch to zoom; arrows to navigate; Home to reset. Pause and reset buttons included. Reduced motion starts paused. No cards.

Verified: build and 28 protected runtime files passed; iPhone 393×852 rendering, drag, wheel zoom, reset, pause/resume, active herons and zero browser errors. Pause held scene time at 12.55 seconds; reset restored camera -0.040,-0.030,1.880. Capture: `exact-preview.png`. Physical multitouch and Android remain untested. Birds/clouds are separate layers.
