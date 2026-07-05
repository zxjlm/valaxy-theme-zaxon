# Curated Contact Sheet Album UI Design

## Context

Zaxon already has an Argus-backed album module with `/albums/`, `/albums/<slug>/`, a static manifest reader, a photo grid, and a lightbox. The current visual implementation is functional, but the album list behaves like ordinary responsive cards. With one published album, the card stretches to the full content width and reads as a large banner rather than a deliberate album object.

Argus is the source of truth for album curation, ordering, derivatives, and photo metadata. Zaxon should continue to consume privacy-safe static JSON and public derivatives only. The public experience should make the album feel like the primary unit, with photos as curated entries inside that album.

## Selected Direction

Use a hybrid design:

- Album browsing uses a curated contact-sheet direction.
- Single-photo viewing uses an editorial detail direction.

The album list and detail grid should feel like a quiet photography archive: stable tiles, thumbnail contact sheets, thin borders, restrained captions, and scan-friendly metadata. Opening a photo should shift into a more immersive single-work view with a larger preview image and a clear EXIF note.

## Goals

- Make `/albums/` feel album-first, not like generic cards.
- Keep album tiles stable when there is only one album.
- Use thumbnails for album list cards and album detail grids.
- Use preview images for the single-photo detail/lightbox view.
- Display public-safe photo metadata: city or place-level location, capture date, camera, lens, focal length, aperture, shutter speed, ISO, and tags.
- Do not expose original image URLs, exact coordinates, or raw EXIF blobs.
- Preserve current keyboard navigation and lightbox accessibility behavior.

## Non-Goals

- Do not build a public map or GPS coordinate view.
- Do not expose original full-resolution images.
- Do not add global album search, tag browsing, map browsing, or timeline filtering in this phase.
- Do not make Zaxon call the Argus API at runtime.

## Data Contract

Argus should continue exporting static album packages consumed by Zaxon. The manifest should keep the existing static structure and add allowlisted EXIF fields to each photo.

`thumbnail_path` is used for `/albums/` list cards and `/albums/<slug>/` contact-sheet grids. `preview_path` is used for the single-photo detail/lightbox image. If a thumbnail is missing, Zaxon may fall back to the preview path, but the preferred export shape includes both.

Recommended photo manifest fields:

```json
{
  "id": "photo-id",
  "original_filename": "DSC0001.jpg",
  "width": 1600,
  "height": 1200,
  "captured_at": "2026-07-04T00:00:00Z",
  "city": "Kyoto",
  "camera_make": "Fujifilm",
  "camera_model": "X-T5",
  "lens_model": "XF 35mm F1.4",
  "focal_length": "35mm",
  "aperture": "f/2.8",
  "shutter_speed": "1/125",
  "iso": 400,
  "ai_tags": ["travel"],
  "manual_tags": ["published"],
  "preview_path": "/albums/kyoto-walk/preview/0001-photo.webp",
  "thumbnail_path": "/albums/kyoto-walk/thumbnail/0001-photo.webp",
  "journal_excerpt": "Rain left the stone lane bright enough to hold the morning."
}
```

Public output must not include exact latitude, longitude, raw provider payloads, full EXIF metadata, source storage keys, original image bytes, internal workflow state, scores, failures, or credentials.

## Zaxon Components

`theme/layouts/albums.vue` should render an album-level contact sheet list. Each album tile should have a fixed comfortable maximum width and should not stretch to fill the entire content frame when the album count is low.

`theme/layouts/album.vue` should render the album archive page: title, description, photo count, date or date range, place summary, and the contact-sheet grid.

`theme/components/ArgusAlbumGrid.vue` should stay focused on the photo grid. It should display thumbnails, preserve aspect ratios, and show compact captions. Hover and focus states may reveal a short metadata line, but the grid should remain scan-first.

`theme/components/ArgusAlbumLightbox.vue` should become the single-photo editorial view. It should use `previewPath` for the image and render a metadata note with journal excerpt, date, city, camera, lens, focal length, aperture, shutter speed, ISO, and tags. Missing metadata fields are omitted.

`theme/composables/albums.ts` and `theme/types/albums.d.ts` should normalize the added EXIF fields without requiring them, so older manifests remain readable.

## Visual Treatment

The album list should read as curated archive material: contact-sheet thumbnails, thin paper-colored borders, quiet ink-blue surfaces in dark mode, and paper-like surfaces in light mode. The card geometry should use the theme's existing small radii and restrained depth.

The album detail grid should be denser than the current generic grid, with captions styled like film edge notes or archive labels. Captions should not cover too much of the photo. Hover and focus can lift the tile slightly, brighten the border, and scale the image subtly.

The single-photo detail view should give the image priority. On desktop, use a large preview image with an adjacent metadata note when space allows. On mobile, stack the metadata below the image. The metadata panel should feel like a field note, not a data table.

## Interaction

- Click or keyboard-activate a thumbnail to open the single-photo view.
- Left and right arrow keys move between photos.
- Escape closes the view.
- Backdrop click closes the view.
- Focus moves into the dialog on open and returns to the triggering thumbnail on close.
- Metadata and controls must not overlap the photo on mobile.

## Error And Empty States

- Missing or invalid index manifest: show the existing friendly `/albums/` empty/error state, restyled as an empty archive box.
- Missing or invalid album manifest: show a friendly album-level error state.
- Empty album: show an empty contact-sheet state.
- Missing thumbnail: fall back to preview path.
- Missing EXIF field: omit the row or chip.
- Missing preview path: omit the photo from rendered grids, matching current normalization behavior.

## Argus Scope

Argus should add public-safe EXIF fields to static album export if those values are available in the private photo record or metadata. The export layer should map and format values into display-friendly fields rather than exporting the full metadata object.

Argus tests should assert:

- `preview_path` and `thumbnail_path` are present in exported photo manifests.
- `focal_length`, `aperture`, `shutter_speed`, and `iso` are exported when available.
- Exact GPS, raw EXIF metadata, source storage keys, errors, and original image references are not exported.
- Existing albums without the new fields still export successfully.

## Zaxon Verification

Run:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Browser verification should cover:

- `/albums/` with one album and multiple albums.
- `/albums/<slug>/` contact-sheet grid.
- Single-photo view with full EXIF fields.
- Single-photo view with partial or missing EXIF fields.
- 1280px desktop and 375px mobile widths.
- Keyboard navigation and focus return.

## Open Decisions

No blocking decisions remain. The selected direction is contact-sheet album browsing plus editorial single-photo detail, with thumbnails for list/grid surfaces and preview images for the detail surface.
