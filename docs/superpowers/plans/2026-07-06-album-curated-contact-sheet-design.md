# Album Curated Contact Sheet Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the existing Argus-backed album UI so `/albums/` reads as a stable curated contact sheet and the photo viewer reads as an editorial field note with public-safe EXIF metadata.

**Architecture:** Keep Argus as a static JSON producer and keep Zaxon as a privacy-safe manifest consumer. Extend the existing album normalizer, tests, Vue SFCs, and SCSS in place; no runtime Argus API calls, no original URLs, no exact coordinates, and no raw EXIF objects.

**Tech Stack:** Valaxy, Vue 3 SFCs, TypeScript, SCSS, Vitest, pnpm workspace scripts, local static demo fixtures.

---

## Scope

This plan covers the Zaxon repository only. Argus export implementation belongs in the Argus repository; this repository consumes the static manifest fields listed in `docs/superpowers/specs/2026-07-05-album-curated-contact-sheet-design.md`.

The referenced design note `design/harumonia-field-notes-theme-spec.md` is not present in this workspace. Preserve the current Field Notes visual language from `theme/styles/layout.scss` and the existing assets in `theme/assets/field-notes/`.

## File Structure

- Modify `theme/types/albums.d.ts`: add optional public-safe EXIF fields to manifest and normalized UI photo types.
- Modify `theme/composables/albums.ts`: normalize `focal_length`, `aperture`, `shutter_speed`, and `iso` without requiring them.
- Modify `theme/composables/albums.spec.ts`: lock down thumbnail fallback, preview filtering, metadata normalization, and privacy-safe omission.
- Modify `theme/layouts/albums.vue`: render album cards as bounded contact-sheet album objects, including a small thumbnail strip.
- Modify `theme/layouts/album.vue`: add album summary helpers for date range and place summary.
- Modify `theme/components/ArgusAlbumGrid.vue`: keep the grid focused on thumbnails, compact captions, and keyboard activation.
- Modify `theme/components/ArgusAlbumLightbox.vue`: render the editorial preview image and metadata note from normalized public-safe fields.
- Modify `theme/styles/layout.scss`: replace the current album styles with contact-sheet list/grid and editorial lightbox styles.
- Modify `demo/public/argus-albums/kyoto-walk/album.json`: add representative public-safe EXIF fixture data.
- Optionally modify `demo/public/argus-albums/index.json`: keep the one-album state so the bounded card can be verified.

## Task 1: Public-Safe Album Metadata Contract

**Files:**
- Modify: `theme/types/albums.d.ts`
- Modify: `theme/composables/albums.ts`
- Modify: `theme/composables/albums.spec.ts`

- [ ] **Step 1: Write the failing metadata normalization test**

In `theme/composables/albums.spec.ts`, inside the existing `it('normalizes album detail manifests', () => { ... })` fixture, add these fields to the `photo-1` manifest object:

```ts
          focal_length: '28mm',
          aperture: 'f/5.6',
          shutter_speed: '1/250',
          iso: 200,
          latitude: 35.0116,
          longitude: 135.7681,
          raw_exif: { LensModel: 'Private raw value' },
          source_storage_key: 'private/originals/photo-1.raf',
```

Add these fields to the expected normalized `photo-1` object in the same test:

```ts
          focalLength: '28mm',
          aperture: 'f/5.6',
          shutterSpeed: '1/250',
          iso: '200',
```

Add these fields to the expected normalized `photo-2` object in the same test:

```ts
          focalLength: '',
          aperture: '',
          shutterSpeed: '',
          iso: '',
```

After the existing `expect(detail).toEqual({ ... })` assertion, add:

```ts
    expect(detail.photos[0]).not.toHaveProperty('latitude')
    expect(detail.photos[0]).not.toHaveProperty('longitude')
    expect(detail.photos[0]).not.toHaveProperty('rawExif')
    expect(detail.photos[0]).not.toHaveProperty('sourceStorageKey')
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `pnpm vitest run theme/composables/albums.spec.ts`

Expected: FAIL because `focalLength`, `aperture`, `shutterSpeed`, and `iso` are not present on normalized photos.

- [ ] **Step 3: Extend the album photo types**

In `theme/types/albums.d.ts`, add these optional manifest fields after `lens_model?: string | null` in `ArgusAlbumPhotoManifest`:

```ts
  focal_length?: string | number | null
  aperture?: string | number | null
  shutter_speed?: string | number | null
  iso?: string | number | null
```

Add these normalized fields after `lens: string` in `ArgusAlbumPhoto`:

```ts
  focalLength: string
  aperture: string
  shutterSpeed: string
  iso: string
```

- [ ] **Step 4: Normalize the new fields**

In `theme/composables/albums.ts`, update the object returned by `normalizeAlbumPhoto(photo)` so the block after `lens: asString(photo.lens_model),` is:

```ts
    lens: asString(photo.lens_model),
    focalLength: asString(photo.focal_length),
    aperture: asString(photo.aperture),
    shutterSpeed: asString(photo.shutter_speed),
    iso: asString(photo.iso),
    tags: normalizeTags(photo),
```

- [ ] **Step 5: Run the targeted test to verify it passes**

Run: `pnpm vitest run theme/composables/albums.spec.ts`

Expected: PASS for all tests in `theme/composables/albums.spec.ts`.

- [ ] **Step 6: Commit**

```bash
git add theme/types/albums.d.ts theme/composables/albums.ts theme/composables/albums.spec.ts
git commit -m "feat: normalize public album exif fields"
```

## Task 2: Album List Contact-Sheet Tiles

**Files:**
- Modify: `theme/layouts/albums.vue`
- Modify: `theme/styles/layout.scss`

- [ ] **Step 1: Add bounded contact-sheet markup**

In `theme/layouts/albums.vue`, replace the existing `div v-else class="argus-albums__list"` block with:

```vue
      <div v-else class="argus-albums__list" :data-count="albums.length">
        <article v-for="album in albums" :key="album.id" class="argus-album-card">
          <RouterLink class="argus-album-card__link" :to="`/albums/${album.slug}`" :aria-label="`打开相册 ${album.title}`" />

          <div class="argus-album-card__sheet" aria-hidden="true">
            <span v-for="slot in 6" :key="slot" class="argus-album-card__frame">
              <img v-if="slot === 1 && album.cover" :src="album.cover" :alt="album.title" loading="lazy">
            </span>
          </div>

          <div class="argus-album-card__body">
            <div class="argus-album-card__meta">
              <span class="field-chip" data-kind="life">Album</span>
              <span>{{ album.photoCount }} photos</span>
            </div>
            <h2>{{ album.title }}</h2>
            <p v-if="album.description">
              {{ album.description }}
            </p>
            <time v-if="album.publishedAt || album.updatedAt" :datetime="album.publishedAt || album.updatedAt">
              {{ formatDate(album.publishedAt || album.updatedAt) }}
            </time>
          </div>
        </article>
      </div>
```

- [ ] **Step 2: Replace the album list SCSS**

In `theme/styles/layout.scss`, replace the current `.argus-albums__list`, `.argus-album-card`, `.argus-album-card__link`, `.argus-album-card__cover`, `.argus-album-card__cover img`, `.argus-album-card__body`, `.argus-album-card__meta`, `.argus-album-card h2`, `.argus-album-card p`, and `.argus-album-card time` rules with:

```scss
.argus-albums__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 360px));
  align-items: start;
  gap: 18px;
  padding-bottom: 72px;
}

.argus-albums__list[data-count='1'] {
  justify-content: start;
}

.argus-album-card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--st-border-default);
  border-radius: var(--st-radius-md);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--st-bg-surface) 96%, transparent), var(--st-bg-surface)),
    var(--st-bg-soft);
  box-shadow: 0 12px 28px rgb(20 38 52 / 8%);
  transition:
    border-color var(--st-duration-fast) var(--st-ease-standard),
    transform var(--st-duration-fast) var(--st-ease-standard),
    box-shadow var(--st-duration-fast) var(--st-ease-standard);
}

.argus-album-card__link {
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: inherit;
}

.argus-album-card__link:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--st-life-primary) 60%, white);
  outline-offset: 3px;
}

.argus-album-card__sheet {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 10px;
  background:
    linear-gradient(90deg, transparent 0 47%, color-mix(in srgb, var(--st-border-default) 54%, transparent) 47% 53%, transparent 53%),
    color-mix(in srgb, var(--st-bg-soft) 92%, var(--st-life-soft));
}

.argus-album-card__frame {
  display: block;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--st-border-default) 82%, transparent);
  border-radius: var(--st-radius-sm);
  background:
    repeating-linear-gradient(
      -45deg,
      color-mix(in srgb, var(--st-bg-canvas) 94%, transparent) 0 8px,
      color-mix(in srgb, var(--st-bg-soft) 96%, transparent) 8px 16px
    );
}

.argus-album-card__frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.argus-album-card__body {
  padding: 16px;
}

.argus-album-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--st-text-muted);
  font-family: var(--st-font-mono);
  font-size: 12px;
}

.argus-album-card h2 {
  margin: 12px 0 8px;
  color: var(--st-text-primary);
  font-size: 22px;
  line-height: 1.28;
}

.argus-album-card p {
  margin: 0;
  color: var(--st-text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

.argus-album-card time {
  display: block;
  margin-top: 14px;
  color: var(--st-text-muted);
  font-family: var(--st-font-mono);
  font-size: 12px;
}
```

- [ ] **Step 3: Run lint for template and SCSS formatting**

Run: `pnpm lint`

Expected: PASS with no Vue or SCSS lint errors.

- [ ] **Step 4: Commit**

```bash
git add theme/layouts/albums.vue theme/styles/layout.scss
git commit -m "feat: restyle album list as contact sheets"
```

## Task 3: Album Detail Summary And Thumbnail Grid

**Files:**
- Modify: `theme/layouts/album.vue`
- Modify: `theme/components/ArgusAlbumGrid.vue`
- Modify: `theme/styles/layout.scss`

- [ ] **Step 1: Add album summary helpers**

In `theme/layouts/album.vue`, add these computed helpers after `const loadError = computed(() => albumIndexState.value.error || albumState.value.error)`:

```ts
const capturedDates = computed(() => album.value?.photos
  .map(photo => photo.capturedAt.slice(0, 10))
  .filter(Boolean)
  .sort() ?? [])

const dateSummary = computed(() => {
  const dates = capturedDates.value
  if (!dates.length)
    return album.value?.updatedAt ? formatDate(album.value.updatedAt) : ''

  const firstDate = dates[0]
  const lastDate = dates[dates.length - 1]
  if (firstDate === lastDate)
    return formatDate(firstDate)

  return `${formatDate(firstDate)} - ${formatDate(lastDate)}`
})

const placeSummary = computed(() => {
  const places = new Set(album.value?.photos.map(photo => photo.city).filter(Boolean))
  return Array.from(places).join(' / ')
})
```

- [ ] **Step 2: Render the album archive facts**

In `theme/layouts/album.vue`, replace the current `<p class="field-catalog__count">` block with:

```vue
          <p class="field-catalog__count argus-album-detail__facts">
            <span>{{ album.photos.length }} photos</span>
            <span v-if="dateSummary">{{ dateSummary }}</span>
            <span v-if="placeSummary">{{ placeSummary }}</span>
          </p>
```

- [ ] **Step 3: Update compact grid captions**

In `theme/components/ArgusAlbumGrid.vue`, add this helper after `aspectStyle(photo: ArgusAlbumPhoto) { ... }`:

```ts
function captionParts(photo: ArgusAlbumPhoto) {
  return [photo.city, photo.capturedAt.slice(0, 10), photo.camera, photo.focalLength]
    .filter(Boolean)
}
```

Replace the current caption span with:

```vue
      <span v-if="captionParts(photo).length" class="argus-album-grid__caption">
        {{ captionParts(photo).join(' · ') }}
      </span>
```

- [ ] **Step 4: Replace the album grid SCSS**

In `theme/styles/layout.scss`, replace the current `.argus-album-detail__description`, `.argus-album-grid`, `.argus-album-grid__item`, `.argus-album-grid__item img`, and `.argus-album-grid__caption` rules with:

```scss
.argus-album-detail__description {
  max-width: 720px;
  margin: 14px 0 0;
  color: var(--st-text-secondary);
  font-size: 16px;
  line-height: 1.8;
}

.argus-album-detail__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}

.argus-album-detail__facts span + span::before {
  padding-right: 14px;
  color: var(--st-border-strong);
  content: '/';
}

.argus-album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 156px), 1fr));
  gap: 8px;
  padding-bottom: 72px;
}

.argus-album-grid__item {
  position: relative;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--st-border-default) 86%, transparent);
  border-radius: var(--st-radius-sm);
  padding: 0;
  background: var(--st-bg-soft);
  color: inherit;
  cursor: zoom-in;
}

.argus-album-grid__item:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--st-life-primary) 60%, white);
  outline-offset: 3px;
}

.argus-album-grid__item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition:
    filter var(--st-duration-fast) var(--st-ease-standard),
    transform var(--st-duration-fast) var(--st-ease-standard);
}

.argus-album-grid__caption {
  position: absolute;
  right: 6px;
  bottom: 6px;
  left: 6px;
  max-height: 42%;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: var(--st-radius-sm);
  padding: 5px 7px;
  background: rgb(7 16 24 / 68%);
  color: white;
  font-family: var(--st-font-mono);
  font-size: 11px;
  line-height: 1.35;
  text-align: left;
}
```

- [ ] **Step 5: Run lint and typecheck**

Run: `pnpm lint`

Expected: PASS with no lint errors.

Run: `pnpm typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add theme/layouts/album.vue theme/components/ArgusAlbumGrid.vue theme/styles/layout.scss
git commit -m "feat: refine album detail contact sheet"
```

## Task 4: Editorial Single-Photo View

**Files:**
- Modify: `theme/components/ArgusAlbumLightbox.vue`
- Modify: `theme/styles/layout.scss`

- [ ] **Step 1: Expand the lightbox metadata list**

In `theme/components/ArgusAlbumLightbox.vue`, replace the `metadata` computed return array with:

```ts
  return [
    ['Date', current.capturedAt.slice(0, 10)],
    ['Place', current.city],
    ['Camera', current.camera],
    ['Lens', current.lens],
    ['Focal length', current.focalLength],
    ['Aperture', current.aperture],
    ['Shutter', current.shutterSpeed],
    ['ISO', current.iso],
    ['Tags', current.tags.join(', ')],
  ].filter((item): item is [string, string] => Boolean(item[1]))
```

- [ ] **Step 2: Add semantic wrappers for the editorial layout**

In `theme/components/ArgusAlbumLightbox.vue`, replace the current `<img>` and `<figcaption>` sibling block with:

```vue
        <div class="argus-lightbox__image">
          <img :src="photo.previewPath" :alt="photo.originalFilename || 'Album photo'">
        </div>

        <figcaption class="argus-lightbox__caption">
          <p class="argus-lightbox__eyebrow">
            Field note
          </p>

          <p v-if="photo.journalExcerpt" class="argus-lightbox__excerpt">
            {{ photo.journalExcerpt }}
          </p>

          <dl v-if="metadata.length" class="argus-lightbox__meta">
            <template v-for="[label, value] in metadata" :key="label">
              <dt>{{ label }}</dt>
              <dd>{{ value }}</dd>
            </template>
          </dl>
        </figcaption>
```

- [ ] **Step 3: Replace the lightbox SCSS**

In `theme/styles/layout.scss`, replace the current `.argus-lightbox__figure`, `.argus-lightbox__figure img`, `.argus-lightbox__caption`, `.argus-lightbox__excerpt`, `.argus-lightbox__meta`, `.argus-lightbox__meta dt`, and `.argus-lightbox__meta dd` rules with:

```scss
.argus-lightbox__figure {
  position: relative;
  z-index: 1;
  display: grid;
  width: min(100%, 1180px);
  max-height: calc(100vh - 32px);
  grid-template-columns: minmax(0, 1fr) minmax(260px, 340px);
  margin: 0;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 16%);
  border-radius: var(--st-radius-lg);
  background: var(--st-bg-canvas);
}

.argus-lightbox__image {
  display: grid;
  min-height: 0;
  place-items: center;
  background: #050b12;
}

.argus-lightbox__image img {
  width: 100%;
  max-height: calc(100vh - 72px);
  object-fit: contain;
}

.argus-lightbox__caption {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  padding: 20px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--st-bg-surface) 96%, transparent), var(--st-bg-surface)),
    var(--st-bg-soft);
}

.argus-lightbox__eyebrow {
  margin: 0;
  color: var(--st-text-muted);
  font-family: var(--st-font-mono);
  font-size: 11px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.argus-lightbox__excerpt {
  margin: 0;
  color: var(--st-text-primary);
  font-size: 15px;
  line-height: 1.75;
}

.argus-lightbox__meta {
  display: grid;
  grid-template-columns: minmax(82px, max-content) 1fr;
  gap: 7px 12px;
  margin: 0;
  color: var(--st-text-secondary);
  font-size: 13px;
}

.argus-lightbox__meta dt {
  color: var(--st-text-muted);
  font-family: var(--st-font-mono);
}

.argus-lightbox__meta dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}
```

Replace the existing mobile lightbox media block with:

```scss
@media (max-width: 760px) {
  .argus-lightbox {
    padding: 0;
  }

  .argus-lightbox__figure {
    width: 100%;
    height: 100%;
    max-height: none;
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 1fr) auto;
    border-radius: 0;
  }

  .argus-lightbox__image img {
    max-height: calc(100vh - 270px);
  }

  .argus-lightbox__caption {
    max-height: 270px;
    overflow: auto;
  }
}
```

- [ ] **Step 4: Verify keyboard behavior still works by code inspection**

Confirm `theme/components/ArgusAlbumLightbox.vue` still contains:

```ts
    case 'Escape':
      emit('close')
      break
    case 'ArrowLeft':
      previous()
      break
    case 'ArrowRight':
      next()
      break
    case 'Tab':
      trapFocus(event)
      break
```

Confirm the backdrop button still contains:

```vue
      <button class="argus-lightbox__backdrop" type="button" tabindex="-1" aria-label="关闭照片预览" @click="emit('close')" />
```

- [ ] **Step 5: Run lint and typecheck**

Run: `pnpm lint`

Expected: PASS with no lint errors.

Run: `pnpm typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add theme/components/ArgusAlbumLightbox.vue theme/styles/layout.scss
git commit -m "feat: add editorial album photo viewer"
```

## Task 5: Demo Fixture Metadata

**Files:**
- Modify: `demo/public/argus-albums/kyoto-walk/album.json`

- [ ] **Step 1: Add representative EXIF fields to all demo photos**

In `demo/public/argus-albums/kyoto-walk/album.json`, add these fields to the `rain-lane` photo after `"lens_model": "Prime 35",`:

```json
      "focal_length": "35mm",
      "aperture": "f/2.8",
      "shutter_speed": "1/125",
      "iso": 400,
```

Add these fields to the `tea-window` photo after `"lens_model": "Prime 35",`:

```json
      "focal_length": "35mm",
      "aperture": "f/4",
      "shutter_speed": "1/160",
      "iso": 320,
```

Add these fields to the `stone-path` photo after `"lens_model": "Prime 35",`:

```json
      "focal_length": "35mm",
      "aperture": "f/5.6",
      "shutter_speed": "1/250",
      "iso": 200,
```

- [ ] **Step 2: Verify fixture privacy**

Run: `rg -n "latitude|longitude|raw_exif|source_storage_key|original_url|original_path|gps|credential|token" demo/public/argus-albums theme`

Expected: no matches for public fixture or theme code.

- [ ] **Step 3: Run the build**

Run: `pnpm build`

Expected: PASS and the demo site builds without JSON or route errors.

- [ ] **Step 4: Commit**

```bash
git add demo/public/argus-albums/kyoto-walk/album.json
git commit -m "test: add public exif album fixture data"
```

## Task 6: Full Verification And Browser Pass

**Files:**
- No planned source edits.

- [ ] **Step 1: Run all static checks**

Run: `pnpm lint`

Expected: PASS.

Run: `pnpm typecheck`

Expected: PASS.

Run: `pnpm build`

Expected: PASS.

- [ ] **Step 2: Start the demo server**

Run: `pnpm dev`

Expected: Valaxy prints a local URL, typically `http://localhost:4859/` or another available port.

- [ ] **Step 3: Verify `/albums/` at desktop width**

Open the local URL at `/albums/` with a 1280px-wide viewport.

Expected:
- The one album card stays near its comfortable card width and does not stretch across the content frame.
- The card reads as a contact-sheet album object with thin frames and restrained metadata.
- The empty/error copy is not visible when the manifest loads.

- [ ] **Step 4: Verify `/albums/kyoto-walk/` at desktop width**

Open `/albums/kyoto-walk/` with a 1280px-wide viewport.

Expected:
- Header shows title, description, photo count, date summary, and place summary.
- The grid uses thumbnail URLs from `/argus-albums/kyoto-walk/thumbnail/...`.
- Captions are compact and do not cover most of the photo.
- Hover lifts the tile and subtly scales the image.

- [ ] **Step 5: Verify the single-photo view at desktop width**

Click the first thumbnail.

Expected:
- Dialog opens with the preview URL from `/argus-albums/kyoto-walk/preview/...`.
- Metadata note shows journal excerpt, Date, Place, Camera, Lens, Focal length, Aperture, Shutter, ISO, and Tags when present.
- Original image URLs, exact coordinates, raw EXIF, storage keys, credentials, and workflow fields are absent.
- Left and right arrow keys move between photos.
- Escape closes the dialog.
- Focus returns to the thumbnail that opened the dialog.

- [ ] **Step 6: Verify mobile layout**

Repeat `/albums/`, `/albums/kyoto-walk/`, and the single-photo view at 375px width.

Expected:
- The album card fits without horizontal overflow.
- Grid captions remain inside each tile.
- The lightbox stacks image above metadata.
- Metadata and controls do not overlap the photo.
- The metadata panel scrolls if content is taller than the available mobile space.

- [ ] **Step 7: Stop the dev server**

Terminate the `pnpm dev` process with `Ctrl-C`.

- [ ] **Step 8: Commit any verification fixes**

If browser verification required small fixes, commit only those changed files:

```bash
git add theme/layouts/albums.vue theme/layouts/album.vue theme/components/ArgusAlbumGrid.vue theme/components/ArgusAlbumLightbox.vue theme/styles/layout.scss demo/public/argus-albums/kyoto-walk/album.json
git commit -m "fix: polish album contact sheet verification"
```

If no files changed during verification, do not create a commit.

## Self-Review

Spec coverage:
- Album-first `/albums/` browsing is covered by Task 2.
- Stable one-album card sizing is covered by Task 2 and Task 6.
- Thumbnail usage for list/grid and preview usage for lightbox is covered by Task 2, Task 3, Task 4, and Task 6.
- Public-safe metadata normalization and display are covered by Task 1, Task 4, and Task 5.
- Privacy exclusions are covered by Task 1 and Task 5.
- Existing keyboard navigation, focus trap, backdrop close, and focus return are preserved and verified in Task 4 and Task 6.
- Empty/error states remain in existing templates and get restyled through the same album style block.
- Argus repository export tests are outside this repository and should be handled in a separate Argus plan.

Placeholder scan:
- No banned placeholder terms, future implementation placeholders, or unspecified test requests remain.

Type consistency:
- Manifest fields use snake_case: `focal_length`, `aperture`, `shutter_speed`, `iso`.
- Normalized UI fields use camelCase: `focalLength`, `aperture`, `shutterSpeed`, `iso`.
- Component references match the normalized `ArgusAlbumPhoto` fields.
