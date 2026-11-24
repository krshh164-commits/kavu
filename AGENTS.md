# Mobile Prototype Agent Guide

## Prototype Instructions

Current Home screen: follow Kāvu Figma frame `2:2` (393 × 852) with its soft green–cream gradient, greeting, days together, last-week assessment, observation availability, and CTA. Replace its static island image with the existing interactive island-and-tree GLBs on a transparent Three.js canvas; horizontal swipe rotates around the vertical axis. Keep device chrome and `painted-world.ts` intact.

Current Profile screen: open from Home avatar. Show days together, completed weekly checkups, and a two-column collection using transparent cutouts. Mossy rock and green tree are unlocked; fallen log, soft grass, mushrooms, and grasshopper have a translucent white image veil with a 10-weekly-checkup unlock label. The collection heading uses Figtree; green tree, mossy rock, mushrooms, and grasshopper use smaller artwork within their cards. The background reuses Home's animated mesh colours with reversed orientation. Keep the Home scene and interactions mounted when Profile opens.

Current Journal screen: open from the Journal bottom tab while keeping Home mounted. The diary is a future physical keepsake of the terrarium's whole journey. Lead each weekly entry with the child's actual photo and words, then small changes and a gentle reflection. Label all invented prototype entries as samples; never imply sample events are saved history. Use the supplied spiral paper and terrarium image for the Week 7 sample. Keep the bottom navigation visible and Journal selected.

Current Explore screen: open the existing `painted-world.ts` island scene from a fourth bottom tab with a binocular icon. Open centered on the island with one tree and one rock at the current zoom; the supplied GpsFix icon resets smoothly to that same view. Keep drag, pinch/wheel zoom, clouds, water, and herons; omit the Pause button. Keep Home mounted; the bottom navigation stays visible with Explore selected.

Current Observation flow: open from Home as four steps: Observe, Mark, Capture, Analyze. Keep the floating navigation on the first three steps and hide it during full-screen analysis. Use Tobias, Figtree, forest-green ink, soft grain, glass controls, and a slightly brighter Home mesh gradient. Observe accepts speech or an editable typed note. Mark lets the child place a yellow translucent dot on the labelled sample prior photo, or skip. Capture accepts one to four real camera or selected photos, with preview, retake, and delete. Analyze uses a calm reveal, careful demo assessment, demo sensor readings, and Vanaspati. Preserve back, close, camera and speech fallbacks. Keep sample material clearly labelled and do not present demo readings as live sensors.

Setup onboarding uses one shell based on Figma “01 · Closed box” across ten steps: Closed box, Explore the kit, six tray-building steps, “Kāvu is ready,” and “Find Kāvu a gentle spot.” Keep the same gradient, grain, Tobias and Urbanist type, Material-style 8 px spacing, 24 px side margins, top back and Skip controls, one accurate ten-step progress bar, and one bottom CTA. Omit the chapter label. The first two screens retain their heading and smaller instruction. On each tray-building screen, put the instruction itself in the Tobias heading at the same size and position; omit the smaller instruction line. The Ready screen uses only its Tobias heading. Back preserves completed tray layers; Skip enters Home. Explore lets children tap the eight pieces to learn their use. Each setup layer animates automatically on screen entry; taps only advance. Replay the current layer on return while preserving completed layers. On the water screen, the bottle arrives, tilts, and pours 50 ml from its cap-mounted nozzle before returning upright; Ready has no bottle or pour. The centered editable SVG tray guides six steps: pebbles, mesh, soil, three seeds, moss, and 50 ml of water from a 100 ml bottle. Keep its pastel painted texture, soft contact shadows, and one 3 px white outer silhouette stroke and one soft offset shadow behind the complete silhouette, giving it a sticker feel. Ready has one restrained glow pulse, ten rising particles, and a brief rim shimmer under 2.5 seconds; reduced motion shows the finished tray without animation. After Ready, show the completed tray on a pastel desk with one white silhouette outline and soft sticker shadow. Explain indirect light with the approved gentle-spot copy; Place Kāvu enters Home. Use a brief arrival motion with reduced-motion support. Keep Home and its 3D scene mounted behind onboarding.

Bottom navigation: all four icon masks and labels inherit the tab colour. Inactive tabs use muted green `#61997A`; the selected tab uses forest `#243A30` on lime `#B3FF49` with the same rounded pill and inset shadow. Switching tabs must restore the prior tab's inactive colours.

Current direction: supplied pastel water with a separate transparent layer of soft blue pigment grains that fade in and out at new positions, plus gentle waves, seven stable well-spaced islands, turquoise shoreline shallows and broken ripples. One island is empty, two lightly planted, two mixed, one full feature island, and one island has five trees of varied sizes. Place bushes, wood, and stones well inside each island; tree base points must stay in the interior while canopies and soft alpha-shaped shadows may extend naturally past shore edges. Draw floor props below tree canopies, then clouds, then flying herons. No grass or cone tree in the scene. Keep painted clouds, herons, drag/zoom, icon-only reset and no cards. Preserve the old landscape asset for reuse.

In ChatGPT Work Mode, run `sites-preview start "$PWD"`, open `http://terminal.local:4173/` in the cloud browser, and verify the rendered app and its primary interactions. Keep that preview open and tell the user to inspect it in the cloud browser; do not present the local URL as a user-facing chat link. In Codex Desktop, run the local server yourself, open the preview in the in-app browser, and provide the clickable local URL. Do not deploy to Sites unless the user explicitly asks to share, publish, or deploy. Do not give the user server-start instructions when you can run it.

Before planning or implementing any mobile-app change, read this `AGENTS.md` in full. It is the source of truth for the template's runtime and component guidance.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Editing Boundary

- Build app-specific UI in `src/Prototype.tsx` and `src/prototype.css`.
- Treat `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `src/mobile/`, `public/assets/iphone/`, `public/assets/android/`, `public/assets/status/`, `vite.config.ts`, `worker/index.js`, and `scripts/prepare-sites-build.mjs` as protected runtime files. Do not edit, replace, remove, or recreate them unless the user explicitly asks to change the mobile runtime itself. For an explicit runtime change, update the affected lock hashes only after verifying the new runtime behavior.
- Run `npm run check:runtime` before preview or handoff. If it fails, restore the protected runtime instead of weakening or bypassing the check.
- `npm run build` preserves the mobile runtime and prepares the static Cloudflare Worker output required by Sites. Before a Sites handoff, confirm `dist/client/index.html`, `dist/server/index.js`, `dist/.openai/hosting.json`, and source `.openai/hosting.json` exist, then run `npm run test:sites`. Do not replace this project with a Vinext starter.

## Runtime Contract

- Preserve the mobile device runtime unless the user's task explicitly asks otherwise. Do not replace it with a standalone page. Visual fidelity applies to app-owned content inside the device screen, not to template-owned device chrome.
- Keep `App` composed around `PhoneFrame` -> `KeyboardProvider`, with `StatusBar`, app content, `HomeIndicator`, and `KeyboardDock` mounted inside the phone frame. `StatusBar` and the iOS home indicator are overlaid device chrome. When the Android keyboard is closed, the app viewport reserves the protected navigation-bar region instead of painting behind it. When the Android keyboard is open, preserve the current full-screen keyboard layout: its asset includes the IME navigation strip and the separate black navigation bar is hidden. iOS screens continue to paint behind the home-indicator area and own their safe-area content padding.
- Preserve the `iPhone` / `Pixel 10` device picker and both calibrated device presets. The Pixel screen is `427 x 952`; its `32 x 32` camera circle and `public/assets/android/navigation-bar.svg` bottom navigation bar are protected device chrome, not app content.
- Preserve the device picker's intentionally lightweight Codex styling in the top-right corner: its trigger wrapper is borderless and transparent, its trigger sizes to content, and its right-aligned menu uses the compact 3px inset plus the specified hairline and elevation shadow layers. Keep the prototype root and default app screen white.
- Preserve `StatusBar` as live device chrome, including its platform-specific typography, source status-icon assets, and spacing. Pixel 10 uses Roboto, Android indicators, and 32px top, left, and right padding. iPhone uses its iOS indicators, system typography, and calibrated spacing. Do not hardcode screenshot times like `9:41` into the status bar, replace its real-time clock, or move status bar content into app markup unless the user explicitly asks for a fixed/mock device time.
- `PhoneFrame` owns the calibrated device frame, screen portal, device picker, camera cutout, and custom cursor. Keep device assets in `public/assets/iphone/` and `public/assets/android/`; if an asset fails to load, repair the asset path or restore the asset instead of removing the frame, keyboard, or image render.
- Use `MobileScroll` directly for simple single-screen prototypes. Use `FlowStack` for conventional multi-screen flows whose routes can own their fixed header and footer; when using it, define each route as a `FlowScreen`: `{ id, header?, headerHeight?, footer?, footerHeight?, render }`, and use `flow.push(screen)`, `flow.pop()`, and `flow.replace(screen)` from `FlowStack` render callbacks or `useFlow()` instead of introducing another router.
- Use `Carousel` for a carousel, horizontal rail, swipeable cards, image or media strip, horizontally scrollable cards, chip rail, or other horizontal collection.
- For a layered app shell—such as a persistent composer, independently presented sheet, pushed/peek sidebar, or app-wide transition—compose directly in `Prototype.tsx` rather than forcing it through `FlowStack`. Keep app-owned fixed chrome as sibling layers outside `MobileScroll`.
- When using `FlowScreen`, put route-owned fixed headers or footers in `FlowScreen.header` or `FlowScreen.footer`. Set `headerHeight` to the visible app-toolbar height; `FlowStack` adds the device's top safe-area/status-bar inset automatically. Do not include `StatusBar` or its height in the header. Set `footerHeight` to the full app-footer height. `FlowScreen.footer` is an overlay, not reserved layout space; screens using it must add their own bottom content padding such as `padding-bottom: calc(var(--flow-footer-height) + var(--mobile-safe-area-height) + 24px)` so final content can scroll above the footer while still painting behind it.
- Render only scrollable content inside `MobileScroll`; it is for content that should move with scroll and rubber-band overscroll. Keep app-owned headers, nav bars, tabs, composers, and overlays outside it. This keeps scroll physics, safe areas, keyboard insets, scrollbars, and drag click suppression active without letting content paint under fixed chrome.
- Buttons, links, cards, and images inside `MobileScroll` should still allow drag scrolling when the pointer moves beyond tap slop. Use `data-scroll-drag="ignore"` only for rare controls that must own the drag gesture themselves.
- Do not add `var(--keyboard-height)` to ordinary screen/content padding inside `MobileScroll`; the scroll viewport already shrinks above the simulated keyboard. For custom fixed composers, search bars, or toast chrome, use `useKeyboardInsets().bottomInset`. It is relative to the app viewport: Android returns `0` while the closed-keyboard viewport already reserves navigation, then returns the keyboard height while open; iOS continues to clear the home indicator while closed and ride directly above the keyboard while open. Do not pin custom bottom chrome to `bottom: 0` or only `keyboardHeight`.
- Use `KeyboardInput`, `KeyboardTextarea`, or `MobileTextField` for every text-entry control. A raw `input` or `textarea` disconnects focus, keyboard animation, safe-area insets, and attached surfaces.
- Use `BottomSheet` for phone-scoped sheets. Its props are `open`, `onOpenChange`, `title`, optional `description`, optional `snap`, and `children`; it renders through the phone screen portal and dismisses the keyboard before opening.

## Horizontal Carousels

- Use `Carousel` for horizontally draggable cards, images, media, chips, or other horizontal collections. Do not recreate these with `overflow-x`, custom pointer handlers, or a generic div.
- `Carousel` can be nested directly inside `MobileScroll`. It owns horizontal gestures and automatically yields vertical gestures to the parent.
- Never put `data-scroll-drag="ignore"` on or around a `Carousel`; doing so prevents vertical parent scrolling when a gesture begins inside it.
- Do not add CSS scroll snapping to `Carousel`; its runtime owns momentum and release motion.
- Use `data-scroll-drag="ignore"` only when a control must prevent parent scrolling in every drag direction.

See `src/mobile/COMPONENTS.md` for the full component and gesture contract.

## Keyboard Rule

The simulated keyboard is a separate top-layer component. Before presenting anything that behaves like iOS navigation or modal UI, dismiss it first.

Call `keyboard.hide()` before:

- pushing, popping, or replacing FlowStack routes
- opening bottom sheets, action sheets, dialogs, menus, or navigation sheets
- starting transitions where the destination should not inherit text-input focus

`FlowStack` already hides the keyboard for `push`, `pop`, and `replace`. `BottomSheet` already hides it before opening. If you add new modal/sheet/navigation primitives, follow the same rule.

When a composer, search surface, or other keyboard-attached component closes, call `keyboard.hide()` in the same event before changing that component's open state. Position attached surfaces from `useKeyboardInsets()` rather than a separate timer or visibility flag so both dismiss together.

When any text-entry control loses focus, dismiss the simulated keyboard. If the control is custom or does not use the runtime's keyboard-aware fields, handle its blur event and call `keyboard.hide()` explicitly. Keep the keyboard open only when focus is moving directly to another text-entry control that should share the same keyboard session.

## Kāvu Visual System

- Treat `KAVU_DESIGN_SYSTEM.md` as the visual source of truth for all new Kāvu screens. It records the palette, typography, spacing, component treatments, imagery, motion, and voice extracted from Figma Home frame `113:103`.
- Preserve that calm, luminous botanical language across new pages while adapting the hierarchy to each page's purpose.

## Interaction Rules

- Do not trigger buttons or inputs after a pointer has become a drag. Preserve the drag suppression behavior in `MobileScroll`.
- Do not allow native browser image/file dragging inside the phone frame. Preserve the phone-level `dragstart` suppression and non-draggable image styles so scroll drags that begin on images still scroll the prototype.
- Use `KeyboardInput`, `KeyboardTextarea`, or `MobileTextField` for text entry so the simulated keyboard and safe-area insets stay connected.
- Fixed phone chrome should not animate with pushed screens. Screen content can animate; the status bar, camera cutout, and preview chrome should stay put.
- Keep the keyboard below the home indicator/safe area layer in z-index, and above ordinary app UI while visible.
- Keep the home indicator as the topmost safe-area layer in the z-index above everything else in the prototype.
