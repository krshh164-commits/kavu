# Kāvu visual design system

Final source of truth: [Kāvu Home in Figma](https://www.figma.com/design/j4PgNECzzTUQdJ6NFFqa1z/K%C4%81vu-%E2%80%94-Home-Screen?node-id=113-103), frame `113:103` (393 × 852), reviewed 2026-11-21. If this document conflicts with older mockups, follow that frame.

## Direction

Kāvu is a luminous, botanical, calm companion for observing a real terrarium. The interface should feel warm, dreamy, tactile, and quietly alive—never clinical, game-like, crowded, or overly glossy.

Use generous breathing room, a central living-world visual, translucent milk-glass controls, soft atmospheric gradients, and one clearly dominant action.

## Colour tokens

| Token | Value | Use |
|---|---:|---|
| Deep forest | `#243A30` | Primary text and calm dark ink |
| Day accent | `#1C8548` | Supporting day line |
| Canvas green | `#D5FFC6` | Base screen colour |
| Glass | `rgba(254,255,249,.61)` | Header controls and bottom navigation |
| Active lime | `#B3FF49` | Selected navigation item |
| Quiet nav text | `#61997A` | Unselected labels |
| Icon green | `#008B3F` | Secondary navigation icons |
| Kāvu teal | `#00465B` | Central/home icon |
| Utility navy | `#1C274C` | Menu and utility icons |
| CTA olive | `#60A50C` | Primary-action gradient start |
| CTA forest | `#16824D` | Primary-action gradient end |
| CTA text pale | `#E6FFB5` → `#F0FFD2` | Primary-action label |

Atmospheric background hues may use peach `#FFBD7A`, cream `#FFEFD8`, aqua `#A3F4E8`, mint `#B4F4CF`, vivid green `#A8FA96`, pale green `#C0F6BC`, and yellow-green `#DCFABB` / `#E7F28F` at low opacity. Blend them as broad radial light, not visible stripes or hard blobs.

In the app, move the broad gradient layers very slowly and place a faint, stationary fine-noise layer over the background. Disable ambient movement when reduced motion is requested.

## Typography

- Display/greeting: **Tobias VF-TRIAL Light**, 32 px, weight 200, automatic line height.
- Supporting information: **Figtree Light**, 20 px, weight 300.
- Status/body: **Figtree Regular**, 16 px, weight 400.
- Actions: **Figtree SemiBold**, 16 px, weight 600.
- Bottom navigation: **Figtree Regular**, 11 px, weight 400, icon-to-label gap 4 px.
- Use zero letter spacing and `#243A30` unless a component token says otherwise.
- Preserve the spelling **Kāvu**.

Tobias provides gentle editorial warmth; Figtree keeps functional content clear. Do not add a third typeface unless a future screen has a strong reason.

## Home layout reference

- Screen: 393 × 852.
- Header: x 26, y 44, 341 × 48.
- Greeting: x 30, y 124, width 260, height 71; 10 px between title and day line.
- Illustration slot: x 30, y 211, 333 × 290. The Figma image is 333 × 350 and clipped by this slot; replace the image with the existing interactive transparent 3D scene while matching the visible framing.
- Weekly reflection: centred at x 110.5, y 517, 172 × 38.
- Primary CTA: x 72.5, y 635, 248 × 62.
- Bottom navigation: x 39, y 743, 315 × 69; home-indicator strip starts y 832.

Future screens may change composition, but should retain the same side margins, calm vertical rhythm, and clear separation between content and fixed navigation.

## Components

### Top controls

- 48 × 48 glass circles, radius 34, fill `rgba(254,255,249,.61)`, 1 px `rgba(244,244,244,.9)` stroke, 9 px backdrop blur.
- Use 24 px rounded line icons. Avoid filled emoji-style controls.
- The left control is menu only; the right uses the existing illustrated profile asset.

### Primary action

- 248 × 62, radius 40; horizontal padding 45, gap 12.
- Fill gradient at about 164°: `#60A50C` → `#16824D`.
- Pale yellow-green semibold label `#E6FFB5` → `#F0FFD2`; 20 px arrow inside a 30 × 29 translucent capsule (`rgba(236,255,199,.21)`, radius 16).
- 1 px cream stroke at 79% opacity; soft green glow `rgba(133,255,51,.15)` at y 8 blur 24.4; neutral shadow `rgba(0,0,0,.11)` at y 2 blur 32; subtle white/yellow-green inner light.
- In the app, let the gradient angle rotate slowly and continuously; press scales to 0.97 and springs back. Respect reduced motion. This motion is an approved implementation extension to the static Figma component.
- Open label: **Start observation**.
- Closed label should communicate timing directly, for example **Opens in 2 days**. Do not repeat the same availability message above it.

### Bottom navigation

- 315 × 69, radius 34, inner padding 6; translucent glass fill and 9 px backdrop blur.
- Three equal items, about 101 × 57. Each combines a 24 px rounded line icon and an 11 px label with 4 px gap.
- Order: **Journal / My kavu / Care**. Selected centre item uses `#B3FF49`, radius 100, with subtle inset shading. Unselected labels use `#61997A`; selected label uses `#243A30`.

## Imagery, material, and motion

- Feature one interactive 3D island/terrarium as the emotional centre of the page.
- Use soft pastel greens, warm cream, peach soil, muted lavender-grey rock, powdery grain, and restrained glow.
- Shadows are soft, low-opacity, directionally consistent, and slightly offset.
- Motion should feel slow and organic. Swipe rotation must remain controlled; avoid constant spectacle.
- Preserve transparency around the 3D canvas so it belongs to the atmospheric background.

## Content voice

Write like a gentle observation companion: warm, simple, factual, and unhurried. Focus attention on the real terrarium rather than implying the app is the living object.

Preferred patterns:

- **Welcome back, Iva**
- **Day 45 with kavu** (literal current Figma copy)
- **Last week, Kavu was calm and steady** (literal current Figma copy, centred on two lines)
- **Start observation** / **Opens in 2 days**

Avoid clinical words such as “assessment” or “checkup” in primary UI when “observation” or “closer look” is clear enough.

The final frame currently uses lowercase/unaccented `kavu` in two supporting lines and the selected navigation label. Match that frame exactly when reproducing it. For new copy, use the brand spelling **Kāvu** unless the user specifies otherwise.

## Rules for new screens

1. Keep one primary purpose and one dominant action per screen.
2. Reuse the forest ink, pastel atmosphere, glass controls, type pairing, icon weight, radii, and shadow softness.
3. Do not put every content group in a card; use spacing and alignment first.
4. Keep saturated lime limited to active navigation and selected states.
5. Maintain accessible tap targets and readable contrast despite translucent surfaces.
6. Use the Home frame as the visual anchor, while adapting hierarchy to the task of each new page.
