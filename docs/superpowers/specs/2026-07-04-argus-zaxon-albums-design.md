# Argus-Zaxon Album Publishing Design

## Context

Zaxon currently treats photo-like content as ordinary Valaxy posts inferred by frontmatter, tags, categories, and keywords. It has a `/notes/` life stream and Field Notes visual language, but no dedicated album module.

Argus already manages private photos, albums, album ordering, cover selection, share links, derivative storage, and a `static_album_export` service. It is the right owner for curation and publication decisions. Zaxon should not call Argus directly during runtime or build because that would couple a static blog to private credentials, storage providers, and a live service.

The agreed boundary is: Argus manages and publishes privacy-safe static album packages; Zaxon consumes those packages and renders the public blog experience.

## Goals

- Let Argus control which albums are published to the blog.
- Support multiple published albums in Phase 1.
- Give Zaxon a native `/albums/` list page and `/albums/<slug>/` detail page.
- Render album details from static manifests with a theme-native grid and lightbox.
- Keep the blog build offline from Argus, credentials, and private storage providers.
- Preserve a clear extension path for Phase 2, where featured photos can enter the home page and `/notes/` life stream.

## Non-Goals

- Do not make Zaxon query the Argus API.
- Do not expose original source photos, exact GPS, full EXIF, storage keys, provider identifiers, credentials, workflow state, scores, or failure details.
- Do not build a full public photo-library frontend with global timeline, map, tag browsing, or search in Phase 1.
- Do not require a Valaxy addon for Phase 1.
- Do not implement Phase 2 featured-photo surfaces yet; only reserve compatible data and composable boundaries.

## Selected Approach

Use a static publishing contract.

Argus adds album publication metadata and exports all published albums into a Valaxy site directory. The export writes a global album index, per-album manifests, local preview/thumbnail derivatives, and thin Valaxy route pages. Zaxon adds album layouts and components that read the static JSON manifests and render the public experience.

This keeps responsibilities crisp:

- Argus owns private management, publication state, storage access, privacy filtering, and static file generation.
- Zaxon owns public rendering, layout, lightbox interaction, empty/error states, and future featured-photo consumption.

## Static Output Shape

The published package should look like this inside a Valaxy project:

```text
public/albums/index.json
public/albums/<slug>/album.json
public/albums/<slug>/preview/<ordered-photo-name>.<ext>
public/albums/<slug>/thumbnail/<ordered-photo-name>.<ext>
pages/albums/index.md
pages/albums/<slug>.md
```

The Markdown pages are route entry points. They should contain minimal frontmatter and hand off rendering to Zaxon layouts/components. Full album HTML should not be generated into Markdown because that would duplicate theme behavior and make lightbox/list aggregation harder to maintain.

## Argus Publication Model

Add publication metadata to `Album`:

```text
published: boolean
published_slug: string | null
published_at: datetime | null
published_sort_order: int
```

- `published` controls whether the album appears in the blog export.
- `published_slug` controls the public URL segment. It must be lowercase URL-safe text.
- `published_at` records when the album was marked or refreshed for publication.
- `published_sort_order` controls ordering on `/albums/`.

Argus UI should eventually expose publish/unpublish, slug, and sort order. The service design must not make CLI the only possible caller.

## Argus Export Services

Refactor the existing static export into two service layers:

```text
single album exporter
  exports one album.json, derivatives, and route page

published albums exporter
  queries all published albums
  orders them by published_sort_order and updated_at
  calls the single album exporter
  writes public/albums/index.json
  optionally prunes unpublished stale output
```

The core logic must live in reusable backend services so both CLI and future UI/API entry points call the same implementation.

CLI examples:

```bash
argus-photo album export <album-id> --site /path/to/blog --slug kyoto-walk --overwrite
argus-photo album export-published --site /path/to/blog --public-base / --overwrite
```

The service should return structured results: exported album count, exported photo count, generated paths, skipped albums, and sanitized failure reasons.

## Manifest Contract

All manifests are versioned with `schema_version: 1`.

`public/albums/index.json`:

```json
{
  "schema_version": 1,
  "generated_at": "2026-07-04T00:00:00Z",
  "albums": [
    {
      "id": "album-id",
      "slug": "kyoto-walk",
      "title": "Kyoto Walk",
      "description": "A quiet walk after rain.",
      "cover": "/albums/kyoto-walk/thumbnail/0001-photo.webp",
      "photo_count": 24,
      "updated_at": "2026-07-04T00:00:00Z",
      "published_at": "2026-07-04T00:00:00Z",
      "sort_order": 10,
      "manifest_path": "/albums/kyoto-walk/album.json"
    }
  ]
}
```

`public/albums/<slug>/album.json`:

```json
{
  "schema_version": 1,
  "album_id": "album-id",
  "slug": "kyoto-walk",
  "title": "Kyoto Walk",
  "description": "A quiet walk after rain.",
  "cover_photo_id": "photo-id",
  "updated_at": "2026-07-04T00:00:00Z",
  "photos": [
    {
      "id": "photo-id",
      "original_filename": "DSC0001.jpg",
      "width": 1600,
      "height": 1200,
      "captured_at": "2026-07-04T00:00:00Z",
      "city": "Kyoto",
      "camera_make": "Argus Camera",
      "camera_model": "A1",
      "lens_model": "Prime",
      "ai_tags": ["travel"],
      "manual_tags": ["published"],
      "preview_path": "/albums/kyoto-walk/preview/0001-photo.webp",
      "thumbnail_path": "/albums/kyoto-walk/thumbnail/0001-photo.webp",
      "featured": false,
      "featured_order": null,
      "journal_excerpt": null
    }
  ]
}
```

The Phase 2 fields are present but optional for Phase 1 consumers:

- `featured`
- `featured_order`
- `journal_excerpt`

Zaxon must tolerate their absence.

## Zaxon Theme Design

Add a dedicated album module:

```text
theme/layouts/albums.vue
theme/layouts/album.vue
theme/components/ArgusAlbumGrid.vue
theme/components/ArgusAlbumLightbox.vue
theme/composables/albums.ts
theme/types/albums.d.ts
```

`/albums/` reads `public/albums/index.json` and renders album cards with cover, title, description, photo count, and update/publication metadata. The visual direction should stay in Field Notes territory: quiet, low-saturation, contact-sheet or travel-photo-folder feeling rather than an admin dashboard.

`/albums/<slug>/` reads the album manifest and renders cover, description, photo grid, and lightbox. The lightbox supports:

- Open from a grid image.
- Previous/next controls.
- Keyboard arrow navigation.
- Esc close.
- Click backdrop close.
- Public photo metadata display: date, city, camera, lens, and tags.
- Omit empty metadata fields instead of rendering blank labels.

Theme configuration:

```ts
themeConfig: {
  albums: {
    enable: true,
    indexPath: '/albums/index.json',
    title: '相册',
    description: '从 Argus 发布的照片记录。',
    featured: {
      enable: false,
      limit: 6,
    },
  },
}
```

The `albums.ts` composable should expose album list/detail helpers and reserve a `featuredPhotos` computation entry point for Phase 2. Phase 1 does not surface featured photos on the home page or `/notes/`.

## Error Handling

Argus:

- Use staging directories/files before replacing existing output.
- Do not replace prior published output if export validation fails.
- Fail an album export when any included photo lacks a readable preview derivative.
- Treat thumbnails as optional and fall back to preview paths.
- During published batch export, fail the whole export by default if any published album fails, so `index.json` and details cannot drift.
- Remove unpublished albums from `index.json`.
- Only delete old unpublished directories when `--prune` is explicitly supplied.
- Sanitize all storage and export errors.

Zaxon:

- If `index.json` is missing or invalid, render a friendly empty/error state on `/albums/` without breaking other site pages.
- If one album manifest is missing or invalid, render a friendly error state for that album page.
- If photo metadata fields are absent, omit them.
- If an album has no photos, render an empty album state.

## Privacy Rules

Public output must be allowlisted. It may contain only:

- Album id, slug, title, description, cover id/path, counts, sort/publication/update timestamps.
- Photo id, original filename, dimensions, captured time, camera/lens labels, city, tags, preview path, thumbnail path, and Phase 2 publication fields.

Public output must not contain:

- Source files or original image bytes.
- Exact GPS coordinates.
- Full EXIF or arbitrary metadata blobs.
- Storage keys, buckets, provider ids, or credentials.
- Private workflow fields, scores, failure reasons, or internal logs.

## Testing Strategy

Argus tests:

- Migration adds publication fields with safe defaults.
- Published slug validation rejects unsafe values.
- Published batch export orders albums correctly.
- `index.json` is generated from published albums only.
- Staging rollback preserves old output after failure.
- Privacy allowlist excludes sensitive fields.
- Unpublished albums disappear from `index.json`.
- `--prune` controls stale directory cleanup.

Zaxon tests:

- Manifest types/composables parse valid fixtures.
- Album list sorting and empty state work.
- Detail grid handles missing optional fields.
- Lightbox open/close and keyboard navigation work.
- Build succeeds offline from fixture manifests and local images.

Integration fixture:

- Add a small demo fixture under `demo/public/albums/` plus route pages under `demo/pages/albums/`.
- Verify `pnpm build` can render album pages without Argus.

## Phase Boundary

Phase 1 implements:

- Argus published album metadata.
- Reusable Argus publish services for CLI and future UI/API callers.
- Batch export of published albums.
- Zaxon `/albums/` list page.
- Zaxon `/albums/<slug>/` detail page.
- Zaxon grid and lightbox.
- Fixture-driven offline demo build.

Phase 1 reserves:

- Manifest fields for featured photos.
- `featuredPhotos` composable entry point.
- Theme config for featured display.

Phase 2 may implement:

- Featured photos on the home page LIFE area.
- Featured photos in `/notes/`.
- Photo wall, tag browsing, location browsing, or richer journal integration.

## Open Implementation Notes

- This design spans two repositories: Argus and `valaxy-theme-zaxon`.
- The Zaxon implementation should follow existing Vue SFC, TypeScript, and Field Notes style conventions.
- The Argus implementation should evolve the existing `static_album_export` service instead of replacing it wholesale.
- The existing generated HTML page can remain as a compatibility fallback during refactor, but the preferred Zaxon path is manifest-driven rendering.
