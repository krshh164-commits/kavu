# Pastel islands

Preview: http://127.0.0.1:4182/

The supplied water and three updated, thinner island PNGs are copied unchanged into public/assets/painted. A seeded scatter places 17 islands with separation. Alpha sampled around each island makes faint turquoise shallows and broken animated shoreline ripples. Water has slow distortion, soft waves and moving fine grain. Existing clouds, herons, drag, zoom, pause and reset remain.

Implementation: src/painted-world.ts and src/pastel-shaders.ts. Original landscape asset retained.

Verified: production build and 28 protected runtime checks pass; iPhone preview renders; drag and wheel zoom change camera; pause holds scene time at 17.05; reset restores -0.040,-0.030,1.880; resume works; no browser errors. Physical pinch and Android not tested. Screenshot: pastel-preview.png.
