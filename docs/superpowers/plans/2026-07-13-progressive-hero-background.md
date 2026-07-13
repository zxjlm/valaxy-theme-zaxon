# Progressive Hero Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a small WebP hero preview immediately, then safely fade in the matching PNG after it downloads and decodes.

**Architecture:** A pure composable selects image variants and evaluates connection restrictions. The home page holds preview/full image state and a monotonic request token, while SCSS supplies two absolute layers and reduced-motion-safe fading.

**Tech Stack:** Vue 3, TypeScript, SCSS, Vitest, Vite asset imports, macOS `sips`.

## Global Constraints

- Retain the four existing PNG assets as final full-resolution images.
- Generate four matching WebP previews, target 20–60 KB each, preserving aspect ratio.
- Skip full-resolution requests for Save-Data, `slow-2g`, and `2g`.
- Reveal full-resolution only after `Image.decode()` resolves.
- Do not fade under `prefers-reduced-motion: reduce`.
- Images remain decorative with empty alt text and no global loading UI.

## File Structure

| File | Responsibility |
| --- | --- |
| `theme/composables/hero-background.ts` | Variant selection, network policy, and stale-token comparison. |
| `theme/composables/hero-background.spec.ts` | Vitest tests for all pure policy behavior. |
| `theme/composables/index.ts` | Public helper export. |
| `theme/pages/index.vue` | Asset maps, image scheduling, and preview/full layers. |
| `theme/styles/layout.scss` | Layer geometry, fade, breeze animation, reduced-motion behavior. |
| `theme/assets/field-notes/hero-field-*-low.webp` | Four derived previews. |

### Task 1: Test and implement the pure loading policy

**Files:**
- Create: `theme/composables/hero-background.ts`
- Create: `theme/composables/hero-background.spec.ts`
- Modify: `theme/composables/index.ts`

**Interfaces:** Produces `heroVariant(isDark, isMobile)`, `shouldLoadHeroQuality(connection?)`, and `isCurrentHeroRequest(current, completed)`. `index.vue` consumes all three.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { heroVariant, isCurrentHeroRequest, shouldLoadHeroQuality } from './hero-background'

describe('hero background policy', () => {
  it.each([
    [false, false, { theme: 'light', viewport: 'desktop' }],
    [false, true, { theme: 'light', viewport: 'mobile' }],
    [true, false, { theme: 'dark', viewport: 'desktop' }],
    [true, true, { theme: 'dark', viewport: 'mobile' }],
  ])('selects the matching variant', (dark, mobile, expected) => {
    expect(heroVariant(dark, mobile)).toEqual(expected)
  })
  it.each([
    [undefined, true],
    [{ saveData: true, effectiveType: '4g' }, false],
    [{ saveData: false, effectiveType: 'slow-2g' }, false],
    [{ saveData: false, effectiveType: '2g' }, false],
    [{ saveData: false, effectiveType: '4g' }, true],
  ])('applies the connection policy', (connection, expected) => {
    expect(shouldLoadHeroQuality(connection)).toBe(expected)
  })
  it('rejects a stale completion', () => {
    expect(isCurrentHeroRequest(3, 2)).toBe(false)
    expect(isCurrentHeroRequest(3, 3)).toBe(true)
  })
})
```

- [ ] **Step 2: Verify red**

Run: `pnpm exec vitest run theme/composables/hero-background.spec.ts`

Expected: FAIL because `./hero-background` is missing.

- [ ] **Step 3: Implement the minimal API**

```ts
export type HeroTheme = 'light' | 'dark'
export type HeroViewport = 'desktop' | 'mobile'
export interface HeroVariant { theme: HeroTheme; viewport: HeroViewport }
export interface ConnectionInfo { saveData?: boolean; effectiveType?: string }
export function heroVariant(isDark: boolean, isMobile: boolean): HeroVariant {
  return { theme: isDark ? 'dark' : 'light', viewport: isMobile ? 'mobile' : 'desktop' }
}
export function shouldLoadHeroQuality(connection?: ConnectionInfo): boolean {
  return !connection?.saveData && connection?.effectiveType !== 'slow-2g' && connection?.effectiveType !== '2g'
}
export function isCurrentHeroRequest(current: number, completed: number): boolean {
  return current === completed
}
```

Add `export * from './hero-background'` to `theme/composables/index.ts`.

- [ ] **Step 4: Verify green and commit**

Run: `pnpm exec vitest run theme/composables/hero-background.spec.ts`

Expected: PASS.

```bash
git add theme/composables/hero-background.ts theme/composables/hero-background.spec.ts theme/composables/index.ts
git commit -m "feat: add hero background loading policy"
```

### Task 2: Generate and check the preview assets

**Files:**
- Create: `theme/assets/field-notes/hero-field-desktop-dark-low.webp`
- Create: `theme/assets/field-notes/hero-field-desktop-light-low.webp`
- Create: `theme/assets/field-notes/hero-field-mobile-dark-low.webp`
- Create: `theme/assets/field-notes/hero-field-mobile-light-low.webp`

**Interfaces:** The page imports these into a `{ light|dark: { desktop|mobile: string } }` preview map, mirroring the existing PNG map.

- [ ] **Step 1: Generate previews**

```bash
sips -Z 768 -s format webp -s formatOptions 55 theme/assets/field-notes/hero-field-desktop-dark.png --out theme/assets/field-notes/hero-field-desktop-dark-low.webp
sips -Z 768 -s format webp -s formatOptions 55 theme/assets/field-notes/hero-field-desktop-light.png --out theme/assets/field-notes/hero-field-desktop-light-low.webp
sips -Z 576 -s format webp -s formatOptions 55 theme/assets/field-notes/hero-field-mobile-dark.png --out theme/assets/field-notes/hero-field-mobile-dark-low.webp
sips -Z 576 -s format webp -s formatOptions 55 theme/assets/field-notes/hero-field-mobile-light.png --out theme/assets/field-notes/hero-field-mobile-light-low.webp
```

- [ ] **Step 2: Validate the assets**

```bash
sips -g format -g pixelWidth -g pixelHeight theme/assets/field-notes/hero-field-*-low.webp
find theme/assets/field-notes -name 'hero-field-*-low.webp' -exec stat -f '%z %N' {} +
```

Expected: WebP output; desktop no larger than 768 px, mobile no larger than 576 px; each file in the 20–60 KB target. Re-encode an over-budget file at quality 45; re-encode a visibly degraded file at quality 65.

- [ ] **Step 3: Commit**

```bash
git add theme/assets/field-notes/hero-field-*-low.webp
git commit -m "feat: add low-quality hero previews"
```

### Task 3: Render preview-first progressive hero layers

**Files:**
- Modify: `theme/pages/index.vue:4-114,119-121`
- Modify: `theme/styles/layout.scss:561-594`

**Interfaces:** Consumes Task 1 helpers and all eight asset imports. Produces `previewHeroImage`, `fullHeroImage`, and `isHeroFullReady` refs. The full loader captures a request number and assigns state only if `isCurrentHeroRequest(heroRequest, request)` remains true.

- [ ] **Step 1: Replace the existing CSS-variable background state**

Import the four WebPs and helpers. Create full and preview maps keyed by `HeroVariant`; initialize `previewHeroImage` to dark desktop WebP, full image to `''`, ready state to `false`, and `heroRequest` to `0`. Change the existing mounted, media-query, and mutation-observer calls from `syncHeroImage()` to `syncHeroImages()`.

```ts
function syncHeroImages() {
  const variant = heroVariant(document.documentElement.classList.contains('dark'), Boolean(heroMediaQuery?.matches))
  previewHeroImage.value = heroPreviewImages[variant.theme][variant.viewport]
  fullHeroImage.value = ''
  isHeroFullReady.value = false
  const request = ++heroRequest
  if (shouldLoadHeroQuality(connectionInfo()))
    scheduleFullHeroLoad(heroFullImages[variant.theme][variant.viewport], request)
}
```

`scheduleFullHeroLoad` must schedule `load` through `window.requestIdleCallback(load, { timeout: 1500 })`, or `window.setTimeout(load, 0)` if unavailable. `load` creates `new Image()`, assigns `src`, awaits `image.decode()`, and only then assigns the full image and ready state if its token is current. Its catch block intentionally leaves the preview displayed.

- [ ] **Step 2: Add the two decorative image layers**

Insert the following before `.field-hero__overlay`:

```vue
<img class="field-hero__image field-hero__image--preview" :src="previewHeroImage" alt="" aria-hidden="true">
<img
  v-if="fullHeroImage"
  class="field-hero__image field-hero__image--full"
  :class="{ 'field-hero__image--ready': isHeroFullReady }"
  :src="fullHeroImage"
  alt=""
  aria-hidden="true"
>
```

- [ ] **Step 3: Replace pseudo-element styles**

Replace `.field-hero::before` with `.field-hero__image`: absolute, `inset: -18px`, `z-index: 0`, `width` and `height` expanded by 36 px, `object-fit: cover`, `object-position: center bottom`, plus its current transform and breeze animation. Add `.field-hero__image--full { opacity: 0; transition: opacity 220ms ease; }` and `.field-hero__image--ready { opacity: 1; }`. In the existing reduced-motion block, target `.field-hero__image` instead of the pseudo-element and disable the full layer transition.

- [ ] **Step 4: Validate and commit**

```bash
pnpm exec vitest run theme/composables/hero-background.spec.ts
pnpm typecheck
pnpm lint
git add theme/pages/index.vue theme/styles/layout.scss theme/composables/hero-background.spec.ts
git commit -m "feat: progressively load hero backgrounds"
```

Expected: test, type check, and lint all pass before committing.

### Task 4: Build and visually verify

**Files:** Verify only: `demo/dist/`. Never commit generated output.

- [ ] **Step 1: Build**

Run: `pnpm build`

Expected: SSG completes. If it fails with `EMFILE`, record the exact environment file-watch error and retry only after the descriptor limit is raised or watching is disabled. Do not change theme code to mask an environment resource limit.

- [ ] **Step 2: Inspect emitted assets**

```bash
find demo/dist/assets -name 'hero-field-*' -exec stat -f '%z %N' {} +
rg -n 'hero-field-(desktop|mobile)-(dark|light)(-low)?' demo/dist/assets --glob '*.js'
```

Expected: eight hero assets and two asset maps in the home chunk.

- [ ] **Step 3: Inspect `/` at desktop and 375 px**

Run `pnpm demo`. Verify preview-first paint, decode-gated fade, no stale full image after a theme or breakpoint change, no fade with reduced motion, preview-only under Save-Data/2G, and readable hero content.

- [ ] **Step 4: Commit only source corrections found during visual verification**

```bash
git status --short
git add theme
git commit -m "fix: polish progressive hero loading"
```

Do this only if verification required source changes; do not create an empty commit.
