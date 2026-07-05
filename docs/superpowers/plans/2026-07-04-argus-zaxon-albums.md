# Argus-Zaxon Albums Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manifest-driven `/albums/` index and `/albums/<slug>/` detail experience to the Zaxon Valaxy theme, backed by Argus static export fixtures.

**Architecture:** Zaxon stays offline from Argus by reading JSON manifests from `public/albums/` through a small typed composable. The route layouts render friendly empty/error states, album cards, a responsive photo grid, and a keyboard-accessible lightbox using the existing Field Notes visual language.

**Tech Stack:** Valaxy, Vue 3 SFCs, TypeScript, SCSS, Vitest, pnpm workspace scripts.

---

## Scope

This repository contains the Zaxon Valaxy theme and demo site only. Argus service, CLI, migration, and export implementation work belongs in the Argus repository; this plan treats the static manifest contract from `docs/superpowers/specs/2026-07-04-argus-zaxon-albums-design.md` as the integration boundary.

## File Structure

- Create `theme/types/albums.d.ts`: public manifest types and normalized UI types.
- Modify `theme/types/index.d.ts`: add `themeConfig.albums` shape.
- Create `theme/composables/albums.ts`: fetch, validate, sort, normalize, and expose album index/detail helpers plus a reserved `featuredPhotos` entry point.
- Modify `theme/composables/index.ts`: export album composable helpers.
- Create `theme/composables/albums.spec.ts`: fixture-driven tests for parsing, sorting, optional fields, invalid input, and featured reservation.
- Create `theme/components/ArgusAlbumGrid.vue`: detail-page photo grid that emits selected photo indexes.
- Create `theme/components/ArgusAlbumLightbox.vue`: lightbox with previous/next, Escape close, arrow keys, backdrop close, and omitted empty metadata.
- Create `theme/layouts/albums.vue`: `/albums/` route layout for the album list page.
- Create `theme/layouts/album.vue`: `/albums/<slug>/` route layout for a single album.
- Modify `theme/styles/layout.scss`: Field Notes album list, grid, lightbox, and responsive styling.
- Modify `demo/valaxy.config.ts`: enable albums config and add nav entry.
- Create `demo/pages/albums/index.md`: route entry for `/albums/`.
- Create `demo/pages/albums/kyoto-walk.md`: route entry for `/albums/kyoto-walk/`.
- Create `demo/public/albums/index.json`: demo album index manifest fixture.
- Create `demo/public/albums/kyoto-walk/album.json`: demo detail manifest fixture.
- Create `demo/public/albums/kyoto-walk/preview/*.svg`: local preview image fixtures.
- Create `demo/public/albums/kyoto-walk/thumbnail/*.svg`: local thumbnail image fixtures.

## Task 1: Album Types And Theme Config

**Files:**
- Create: `theme/types/albums.d.ts`
- Modify: `theme/types/index.d.ts`

- [ ] **Step 1: Create album manifest and UI types**

Create `theme/types/albums.d.ts` with:

```ts
export interface ArgusAlbumIndexManifest {
  schema_version: 1
  generated_at?: string
  albums: ArgusAlbumSummaryManifest[]
}

export interface ArgusAlbumSummaryManifest {
  id: string
  slug: string
  title: string
  description?: string | null
  cover?: string | null
  photo_count: number
  updated_at?: string | null
  published_at?: string | null
  sort_order?: number | null
  manifest_path: string
}

export interface ArgusAlbumManifest {
  schema_version: 1
  album_id: string
  slug: string
  title: string
  description?: string | null
  cover_photo_id?: string | null
  updated_at?: string | null
  photos: ArgusAlbumPhotoManifest[]
}

export interface ArgusAlbumPhotoManifest {
  id: string
  original_filename?: string | null
  width?: number | null
  height?: number | null
  captured_at?: string | null
  city?: string | null
  camera_make?: string | null
  camera_model?: string | null
  lens_model?: string | null
  ai_tags?: string[]
  manual_tags?: string[]
  preview_path: string
  thumbnail_path?: string | null
  featured?: boolean
  featured_order?: number | null
  journal_excerpt?: string | null
}

export interface ArgusAlbumSummary {
  id: string
  slug: string
  title: string
  description: string
  cover: string
  photoCount: number
  updatedAt: string
  publishedAt: string
  sortOrder: number
  manifestPath: string
}

export interface ArgusAlbumPhoto {
  id: string
  originalFilename: string
  width?: number
  height?: number
  capturedAt: string
  city: string
  camera: string
  lens: string
  tags: string[]
  previewPath: string
  thumbnailPath: string
  featured: boolean
  featuredOrder: number | null
  journalExcerpt: string
}

export interface ArgusAlbumDetail {
  albumId: string
  slug: string
  title: string
  description: string
  coverPhotoId: string
  updatedAt: string
  photos: ArgusAlbumPhoto[]
}

export interface ArgusAlbumsConfig {
  enable: boolean
  indexPath: string
  title: string
  description: string
  featured: {
    enable: boolean
    limit: number
  }
}

export interface ArgusAlbumsState<T> {
  data: T | null
  pending: boolean
  error: string
}
```

- [ ] **Step 2: Extend theme config typing**

In `theme/types/index.d.ts`, add this import at the top:

```ts
import type { ArgusAlbumsConfig } from './albums'
```

Then add this property inside `ThemeConfig` after the existing `content` block:

```ts
  /**
   * Argus static album publishing integration.
   */
  albums?: Partial<ArgusAlbumsConfig>
```

- [ ] **Step 3: Run typecheck for the type-only change**

Run: `pnpm typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add theme/types/albums.d.ts theme/types/index.d.ts
git commit -m "feat: add Argus album types"
```

## Task 2: Album Composable With Tests

**Files:**
- Create: `theme/composables/albums.ts`
- Create: `theme/composables/albums.spec.ts`
- Modify: `theme/composables/index.ts`

- [ ] **Step 1: Write failing composable tests**

Create `theme/composables/albums.spec.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import {
  defaultAlbumsConfig,
  featuredPhotos,
  normalizeAlbumDetail,
  normalizeAlbumIndex,
  resolveAlbumManifestPath,
} from './albums'

describe('normalizeAlbumIndex', () => {
  it('sorts albums by sort order then publication date', () => {
    const albums = normalizeAlbumIndex({
      schema_version: 1,
      generated_at: '2026-07-04T00:00:00Z',
      albums: [
        {
          id: 'late',
          slug: 'late',
          title: 'Late',
          description: null,
          cover: null,
          photo_count: 2,
          updated_at: '2026-07-04T02:00:00Z',
          published_at: '2026-07-04T02:00:00Z',
          sort_order: 20,
          manifest_path: '/albums/late/album.json',
        },
        {
          id: 'first',
          slug: 'first',
          title: 'First',
          description: 'A first album.',
          cover: '/albums/first/thumbnail/0001.svg',
          photo_count: 1,
          updated_at: '2026-07-04T01:00:00Z',
          published_at: '2026-07-04T01:00:00Z',
          sort_order: 10,
          manifest_path: '/albums/first/album.json',
        },
      ],
    })

    expect(albums.map(album => album.slug)).toEqual(['first', 'late'])
    expect(albums[1].description).toBe('')
    expect(albums[1].cover).toBe('')
  })

  it('rejects invalid index manifests', () => {
    expect(() => normalizeAlbumIndex({ schema_version: 2, albums: [] })).toThrow('Unsupported album index schema')
    expect(() => normalizeAlbumIndex({ schema_version: 1 })).toThrow('Album index is missing albums')
  })
})

describe('normalizeAlbumDetail', () => {
  it('normalizes optional metadata and falls back from thumbnail to preview', () => {
    const album = normalizeAlbumDetail({
      schema_version: 1,
      album_id: 'album-id',
      slug: 'kyoto-walk',
      title: 'Kyoto Walk',
      description: null,
      cover_photo_id: null,
      updated_at: null,
      photos: [
        {
          id: 'photo-id',
          original_filename: 'DSC0001.jpg',
          width: 1600,
          height: 1200,
          captured_at: null,
          city: 'Kyoto',
          camera_make: 'Argus',
          camera_model: 'A1',
          lens_model: '',
          ai_tags: ['travel'],
          manual_tags: ['published', 'travel'],
          preview_path: '/albums/kyoto-walk/preview/0001.svg',
          thumbnail_path: null,
          featured: true,
          featured_order: 3,
          journal_excerpt: null,
        },
      ],
    })

    expect(album.description).toBe('')
    expect(album.photos[0].thumbnailPath).toBe('/albums/kyoto-walk/preview/0001.svg')
    expect(album.photos[0].camera).toBe('Argus A1')
    expect(album.photos[0].lens).toBe('')
    expect(album.photos[0].tags).toEqual(['travel', 'published'])
  })

  it('rejects invalid detail manifests', () => {
    expect(() => normalizeAlbumDetail({ schema_version: 2, photos: [] })).toThrow('Unsupported album detail schema')
    expect(() => normalizeAlbumDetail({ schema_version: 1 })).toThrow('Album detail is missing photos')
  })
})

describe('album helpers', () => {
  it('uses default configuration values', () => {
    expect(defaultAlbumsConfig).toEqual({
      enable: true,
      indexPath: '/albums/index.json',
      title: '相册',
      description: '从 Argus 发布的照片记录。',
      featured: {
        enable: false,
        limit: 6,
      },
    })
  })

  it('resolves detail manifest paths from the index when available', () => {
    const albums = normalizeAlbumIndex({
      schema_version: 1,
      albums: [
        {
          id: 'album-id',
          slug: 'kyoto-walk',
          title: 'Kyoto Walk',
          cover: '/albums/kyoto-walk/thumbnail/0001.svg',
          photo_count: 1,
          manifest_path: '/albums/kyoto-walk/album.json',
        },
      ],
    })

    expect(resolveAlbumManifestPath('kyoto-walk', albums)).toBe('/albums/kyoto-walk/album.json')
    expect(resolveAlbumManifestPath('missing', albums)).toBe('/albums/missing/album.json')
  })

  it('reserves featured photos sorted by featured order', () => {
    const album = normalizeAlbumDetail({
      schema_version: 1,
      album_id: 'album-id',
      slug: 'kyoto-walk',
      title: 'Kyoto Walk',
      photos: [
        { id: 'b', preview_path: '/b.svg', featured: true, featured_order: 2 },
        { id: 'a', preview_path: '/a.svg', featured: true, featured_order: 1 },
        { id: 'c', preview_path: '/c.svg', featured: false },
      ],
    })

    expect(featuredPhotos([album], 1).map(photo => photo.id)).toEqual(['a'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run theme/composables/albums.spec.ts`

Expected: FAIL because `theme/composables/albums.ts` does not exist.

- [ ] **Step 3: Implement the composable**

Create `theme/composables/albums.ts` with:

```ts
import type {
  ArgusAlbumDetail,
  ArgusAlbumIndexManifest,
  ArgusAlbumManifest,
  ArgusAlbumPhoto,
  ArgusAlbumPhotoManifest,
  ArgusAlbumSummary,
  ArgusAlbumsConfig,
  ArgusAlbumsState,
} from '../types/albums'
import { computed, onMounted, ref } from 'vue'
import { useThemeConfig } from './config'

export const defaultAlbumsConfig: ArgusAlbumsConfig = {
  enable: true,
  indexPath: '/albums/index.json',
  title: '相册',
  description: '从 Argus 发布的照片记录。',
  featured: {
    enable: false,
    limit: 6,
  },
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Album manifest must be an object')
  return value as Record<string, unknown>
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function optionalNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function uniqueStrings(values: unknown[]) {
  return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.length > 0))]
}

function normalizePhoto(photo: ArgusAlbumPhotoManifest): ArgusAlbumPhoto {
  const camera = [photo.camera_make, photo.camera_model]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' ')

  return {
    id: asString(photo.id),
    originalFilename: asString(photo.original_filename),
    width: optionalNumber(photo.width),
    height: optionalNumber(photo.height),
    capturedAt: asString(photo.captured_at),
    city: asString(photo.city),
    camera,
    lens: asString(photo.lens_model),
    tags: uniqueStrings([...(photo.ai_tags || []), ...(photo.manual_tags || [])]),
    previewPath: asString(photo.preview_path),
    thumbnailPath: asString(photo.thumbnail_path, asString(photo.preview_path)),
    featured: photo.featured === true,
    featuredOrder: typeof photo.featured_order === 'number' ? photo.featured_order : null,
    journalExcerpt: asString(photo.journal_excerpt),
  }
}

export function normalizeAlbumIndex(input: unknown): ArgusAlbumSummary[] {
  const manifest = asRecord(input) as unknown as ArgusAlbumIndexManifest
  if (manifest.schema_version !== 1)
    throw new Error('Unsupported album index schema')
  if (!Array.isArray(manifest.albums))
    throw new Error('Album index is missing albums')

  return manifest.albums
    .map(album => ({
      id: asString(album.id),
      slug: asString(album.slug),
      title: asString(album.title, 'Untitled Album'),
      description: asString(album.description),
      cover: asString(album.cover),
      photoCount: asNumber(album.photo_count),
      updatedAt: asString(album.updated_at),
      publishedAt: asString(album.published_at),
      sortOrder: asNumber(album.sort_order, 9999),
      manifestPath: asString(album.manifest_path, `/albums/${album.slug}/album.json`),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title))
}

export function normalizeAlbumDetail(input: unknown): ArgusAlbumDetail {
  const manifest = asRecord(input) as unknown as ArgusAlbumManifest
  if (manifest.schema_version !== 1)
    throw new Error('Unsupported album detail schema')
  if (!Array.isArray(manifest.photos))
    throw new Error('Album detail is missing photos')

  return {
    albumId: asString(manifest.album_id),
    slug: asString(manifest.slug),
    title: asString(manifest.title, 'Untitled Album'),
    description: asString(manifest.description),
    coverPhotoId: asString(manifest.cover_photo_id),
    updatedAt: asString(manifest.updated_at),
    photos: manifest.photos.map(normalizePhoto).filter(photo => photo.previewPath),
  }
}

export function resolveAlbumManifestPath(slug: string, albums: ArgusAlbumSummary[]) {
  return albums.find(album => album.slug === slug)?.manifestPath || `/albums/${slug}/album.json`
}

export function featuredPhotos(albums: ArgusAlbumDetail[], limit = defaultAlbumsConfig.featured.limit) {
  return albums
    .flatMap(album => album.photos)
    .filter(photo => photo.featured)
    .sort((a, b) => (a.featuredOrder ?? 9999) - (b.featuredOrder ?? 9999))
    .slice(0, limit)
}

export function useAlbumsConfig() {
  const themeConfig = useThemeConfig()
  return computed<ArgusAlbumsConfig>(() => ({
    ...defaultAlbumsConfig,
    ...(themeConfig.value.albums || {}),
    featured: {
      ...defaultAlbumsConfig.featured,
      ...(themeConfig.value.albums?.featured || {}),
    },
  }))
}

async function fetchJson(path: string) {
  const response = await fetch(path)
  if (!response.ok)
    throw new Error(`Unable to load ${path}`)
  return response.json()
}

export function useAlbumIndex() {
  const config = useAlbumsConfig()
  const data = ref<ArgusAlbumSummary[] | null>(null)
  const pending = ref(false)
  const error = ref('')

  onMounted(async () => {
    if (!config.value.enable)
      return

    pending.value = true
    error.value = ''
    try {
      data.value = normalizeAlbumIndex(await fetchJson(config.value.indexPath))
    }
    catch (err) {
      data.value = []
      error.value = err instanceof Error ? err.message : 'Unable to load albums'
    }
    finally {
      pending.value = false
    }
  })

  return computed<ArgusAlbumsState<ArgusAlbumSummary[]>>(() => ({
    data: data.value,
    pending: pending.value,
    error: error.value,
  }))
}

export function useAlbumDetail(slug: string, manifestPath?: string) {
  const data = ref<ArgusAlbumDetail | null>(null)
  const pending = ref(false)
  const error = ref('')

  onMounted(async () => {
    pending.value = true
    error.value = ''
    try {
      data.value = normalizeAlbumDetail(await fetchJson(manifestPath || `/albums/${slug}/album.json`))
    }
    catch (err) {
      data.value = null
      error.value = err instanceof Error ? err.message : 'Unable to load album'
    }
    finally {
      pending.value = false
    }
  })

  return computed<ArgusAlbumsState<ArgusAlbumDetail>>(() => ({
    data: data.value,
    pending: pending.value,
    error: error.value,
  }))
}
```

- [ ] **Step 4: Export the composable**

In `theme/composables/index.ts`, append:

```ts
export * from './albums'
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm exec vitest run theme/composables/albums.spec.ts`

Expected: PASS with all tests in `albums.spec.ts` green.

- [ ] **Step 6: Run typecheck**

Run: `pnpm typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add theme/composables/albums.ts theme/composables/albums.spec.ts theme/composables/index.ts
git commit -m "feat: add album manifest composable"
```

## Task 3: Album Grid Component

**Files:**
- Create: `theme/components/ArgusAlbumGrid.vue`

- [ ] **Step 1: Create the grid component**

Create `theme/components/ArgusAlbumGrid.vue` with:

```vue
<script setup lang="ts">
import type { ArgusAlbumPhoto } from '../types/albums'

defineProps<{
  photos: ArgusAlbumPhoto[]
}>()

const emit = defineEmits<{
  select: [index: number]
}>()

function aspectStyle(photo: ArgusAlbumPhoto) {
  if (photo.width && photo.height)
    return { aspectRatio: `${photo.width} / ${photo.height}` }
  return { aspectRatio: '4 / 3' }
}
</script>

<template>
  <p v-if="!photos.length" class="argus-album-empty">
    这本相册还没有可展示的照片。
  </p>

  <div v-else class="argus-album-grid">
    <button
      v-for="(photo, index) in photos"
      :key="photo.id"
      class="argus-album-grid__item"
      type="button"
      :style="aspectStyle(photo)"
      :aria-label="`打开照片 ${index + 1}`"
      @click="emit('select', index)"
    >
      <img :src="photo.thumbnailPath" :alt="photo.originalFilename || `Album photo ${index + 1}`" loading="lazy">
      <span v-if="photo.city || photo.capturedAt" class="argus-album-grid__caption">
        {{ [photo.city, photo.capturedAt.slice(0, 10)].filter(Boolean).join(' · ') }}
      </span>
    </button>
  </div>
</template>
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add theme/components/ArgusAlbumGrid.vue
git commit -m "feat: add album photo grid"
```

## Task 4: Album Lightbox Component

**Files:**
- Create: `theme/components/ArgusAlbumLightbox.vue`

- [ ] **Step 1: Create the lightbox component**

Create `theme/components/ArgusAlbumLightbox.vue` with:

```vue
<script setup lang="ts">
import type { ArgusAlbumPhoto } from '../types/albums'
import { computed, onBeforeUnmount, watch } from 'vue'

const props = defineProps<{
  photos: ArgusAlbumPhoto[]
  activeIndex: number
}>()

const emit = defineEmits<{
  close: []
  update: [index: number]
}>()

const isOpen = computed(() => props.activeIndex >= 0 && props.activeIndex < props.photos.length)
const photo = computed(() => isOpen.value ? props.photos[props.activeIndex] : null)

const metadata = computed(() => {
  const current = photo.value
  if (!current)
    return []

  return [
    ['Date', current.capturedAt.slice(0, 10)],
    ['City', current.city],
    ['Camera', current.camera],
    ['Lens', current.lens],
    ['Tags', current.tags.join(', ')],
  ].filter((item): item is [string, string] => Boolean(item[1]))
})

function previous() {
  if (!props.photos.length)
    return
  emit('update', (props.activeIndex - 1 + props.photos.length) % props.photos.length)
}

function next() {
  if (!props.photos.length)
    return
  emit('update', (props.activeIndex + 1) % props.photos.length)
}

function onKeydown(event: KeyboardEvent) {
  if (!isOpen.value)
    return
  if (event.key === 'Escape')
    emit('close')
  if (event.key === 'ArrowLeft')
    previous()
  if (event.key === 'ArrowRight')
    next()
}

watch(isOpen, (open) => {
  document.body.classList.toggle('argus-lightbox-open', open)
})

if (typeof window !== 'undefined')
  window.addEventListener('keydown', onKeydown)

onBeforeUnmount(() => {
  document.body.classList.remove('argus-lightbox-open')
  if (typeof window !== 'undefined')
    window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="photo" class="argus-lightbox" role="dialog" aria-modal="true" aria-label="照片预览">
      <button class="argus-lightbox__backdrop" type="button" aria-label="关闭照片预览" @click="emit('close')" />

      <figure class="argus-lightbox__figure">
        <button class="argus-lightbox__close" type="button" aria-label="关闭照片预览" @click="emit('close')">
          ×
        </button>

        <img :src="photo.previewPath" :alt="photo.originalFilename || 'Album photo'">

        <figcaption class="argus-lightbox__caption">
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

        <button class="argus-lightbox__nav argus-lightbox__nav--prev" type="button" aria-label="上一张照片" @click="previous">
          ‹
        </button>
        <button class="argus-lightbox__nav argus-lightbox__nav--next" type="button" aria-label="下一张照片" @click="next">
          ›
        </button>
      </figure>
    </div>
  </Teleport>
</template>
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add theme/components/ArgusAlbumLightbox.vue
git commit -m "feat: add album lightbox"
```

## Task 5: Album Route Layouts

**Files:**
- Create: `theme/layouts/albums.vue`
- Create: `theme/layouts/album.vue`

- [ ] **Step 1: Create the album index layout**

Create `theme/layouts/albums.vue` with:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useAlbumIndex, useAlbumsConfig } from '../composables'

const config = useAlbumsConfig()
const albumState = useAlbumIndex()
const albums = computed(() => albumState.value.data || [])

function formatDate(value: string) {
  if (!value)
    return ''
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(new Date(value))
}
</script>

<template>
  <Layout>
    <div class="field-catalog argus-albums">
      <div class="field-catalog__header">
        <p class="field-kicker">
          Albums
        </p>
        <h1 class="field-catalog__title">
          {{ config.title }}
        </h1>
        <p class="field-catalog__count">
          {{ config.description }}
        </p>
        <div class="field-notes__intro">
          <RouterView />
        </div>
      </div>

      <p v-if="albumState.pending" class="argus-album-empty">
        正在整理相册。
      </p>
      <p v-else-if="albumState.error" class="argus-album-empty">
        暂时没有可展示的相册。
      </p>
      <p v-else-if="!albums.length" class="argus-album-empty">
        这里还没有公开相册。
      </p>

      <div v-else class="argus-albums__list">
        <article v-for="album in albums" :key="album.id" class="argus-album-card">
          <RouterLink class="argus-album-card__link" :to="`/albums/${album.slug}/`" :aria-label="`打开相册 ${album.title}`" />
          <div class="argus-album-card__cover">
            <img v-if="album.cover" :src="album.cover" :alt="album.title" loading="lazy">
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
            <time v-if="album.publishedAt || album.updatedAt">
              {{ formatDate(album.publishedAt || album.updatedAt) }}
            </time>
          </div>
        </article>
      </div>
    </div>
  </Layout>
</template>
```

- [ ] **Step 2: Create the album detail layout**

Create `theme/layouts/album.vue` with:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import ArgusAlbumGrid from '../components/ArgusAlbumGrid.vue'
import ArgusAlbumLightbox from '../components/ArgusAlbumLightbox.vue'
import { useAlbumDetail } from '../composables'

const route = useRoute()
const slug = computed(() => String(route.params.slug || route.path.split('/').filter(Boolean).at(-1) || ''))
const albumState = useAlbumDetail(slug.value)
const album = computed(() => albumState.value.data)
const activeIndex = ref(-1)

function formatDate(value: string) {
  if (!value)
    return ''
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(new Date(value))
}
</script>

<template>
  <Layout>
    <article class="field-catalog argus-album-detail">
      <RouterLink class="argus-album-detail__back" to="/albums/">
        ← 返回相册
      </RouterLink>

      <p v-if="albumState.pending" class="argus-album-empty">
        正在装入相册。
      </p>
      <p v-else-if="albumState.error" class="argus-album-empty">
        这本相册暂时无法显示。
      </p>

      <template v-else-if="album">
        <header class="field-catalog__header">
          <p class="field-kicker">
            Album
          </p>
          <h1 class="field-catalog__title">
            {{ album.title }}
          </h1>
          <p v-if="album.description" class="argus-album-detail__description">
            {{ album.description }}
          </p>
          <p class="field-catalog__count">
            {{ album.photos.length }} photos<span v-if="album.updatedAt"> · {{ formatDate(album.updatedAt) }}</span>
          </p>
        </header>

        <ArgusAlbumGrid :photos="album.photos" @select="activeIndex = $event" />
        <ArgusAlbumLightbox :photos="album.photos" :active-index="activeIndex" @update="activeIndex = $event" @close="activeIndex = -1" />
      </template>
    </article>
  </Layout>
</template>
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add theme/layouts/albums.vue theme/layouts/album.vue
git commit -m "feat: add album layouts"
```

## Task 6: Album Styling

**Files:**
- Modify: `theme/styles/layout.scss`

- [ ] **Step 1: Add album styles**

Append this block near the existing catalog styles in `theme/styles/layout.scss`:

```scss
.argus-albums__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 18px;
  padding-bottom: 72px;
}

.argus-album-card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--st-border-default);
  border-radius: var(--st-radius-lg);
  background: color-mix(in srgb, var(--st-bg-surface) 94%, transparent);
  transition:
    border-color var(--st-duration-fast) var(--st-ease-standard),
    transform var(--st-duration-fast) var(--st-ease-standard);
}

.argus-album-card__link {
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: inherit;
}

.argus-album-card__cover {
  display: grid;
  aspect-ratio: 4 / 3;
  place-items: center;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--st-life-primary) 18%, transparent), transparent 48%),
    var(--st-bg-soft);
}

.argus-album-card__cover img {
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

.argus-album-empty {
  border: 1px dashed var(--st-border-default);
  border-radius: var(--st-radius-lg);
  padding: 22px;
  background: var(--st-bg-surface);
  color: var(--st-text-secondary);
  line-height: 1.7;
}

.argus-album-detail__back {
  display: inline-flex;
  margin-top: 16px;
  color: var(--st-text-muted);
  font-size: 14px;
  font-weight: 650;
}

.argus-album-detail__description {
  max-width: 720px;
  margin: 14px 0 0;
  color: var(--st-text-secondary);
  font-size: 16px;
  line-height: 1.8;
}

.argus-album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  gap: 10px;
  padding-bottom: 72px;
}

.argus-album-grid__item {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--st-border-default);
  border-radius: var(--st-radius-md);
  padding: 0;
  background: var(--st-bg-soft);
  color: inherit;
  cursor: zoom-in;
}

.argus-album-grid__item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--st-duration-fast) var(--st-ease-standard);
}

.argus-album-grid__caption {
  position: absolute;
  right: 8px;
  bottom: 8px;
  left: 8px;
  border-radius: var(--st-radius-sm);
  padding: 5px 7px;
  background: rgb(7 16 24 / 68%);
  color: white;
  font-family: var(--st-font-mono);
  font-size: 11px;
  line-height: 1.4;
}

.argus-lightbox-open {
  overflow: hidden;
}

.argus-lightbox {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  padding: clamp(12px, 4vw, 34px);
}

.argus-lightbox__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgb(4 10 16 / 86%);
}

.argus-lightbox__figure {
  position: relative;
  z-index: 1;
  display: grid;
  width: min(100%, 1100px);
  max-height: calc(100vh - 32px);
  grid-template-rows: minmax(0, 1fr) auto;
  margin: 0;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 16%);
  border-radius: var(--st-radius-lg);
  background: var(--st-bg-canvas);
}

.argus-lightbox__figure img {
  width: 100%;
  max-height: calc(100vh - 190px);
  object-fit: contain;
  background: #050b12;
}

.argus-lightbox__caption {
  padding: 14px 16px 16px;
}

.argus-lightbox__excerpt {
  margin: 0 0 12px;
  color: var(--st-text-primary);
  line-height: 1.7;
}

.argus-lightbox__meta {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 12px;
  margin: 0;
  color: var(--st-text-secondary);
  font-size: 13px;
}

.argus-lightbox__meta dt {
  color: var(--st-text-muted);
  font-family: var(--st-font-mono);
}

.argus-lightbox__meta dd {
  margin: 0;
}

.argus-lightbox__close,
.argus-lightbox__nav {
  position: absolute;
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 24%);
  border-radius: var(--st-radius-md);
  background: rgb(7 16 24 / 72%);
  color: white;
  cursor: pointer;
  font-size: 24px;
}

.argus-lightbox__close {
  top: 12px;
  right: 12px;
}

.argus-lightbox__nav {
  top: 50%;
  transform: translateY(-50%);
}

.argus-lightbox__nav--prev {
  left: 12px;
}

.argus-lightbox__nav--next {
  right: 12px;
}

@media (hover: hover) {
  .argus-album-card:hover,
  .argus-album-grid__item:hover {
    border-color: color-mix(in srgb, var(--st-life-primary) 55%, var(--st-border-strong));
    transform: translateY(-2px);
  }

  .argus-album-grid__item:hover img {
    transform: scale(1.035);
  }
}

@media (max-width: 640px) {
  .argus-lightbox {
    padding: 0;
  }

  .argus-lightbox__figure {
    width: 100%;
    height: 100%;
    max-height: none;
    border-radius: 0;
  }

  .argus-lightbox__figure img {
    max-height: calc(100vh - 210px);
  }
}
```

- [ ] **Step 2: Run lint**

Run: `pnpm lint`

Expected: PASS with no ESLint or formatter errors.

- [ ] **Step 3: Commit**

```bash
git add theme/styles/layout.scss
git commit -m "feat: style album pages"
```

## Task 7: Demo Fixture And Routes

**Files:**
- Modify: `demo/valaxy.config.ts`
- Create: `demo/pages/albums/index.md`
- Create: `demo/pages/albums/kyoto-walk.md`
- Create: `demo/public/albums/index.json`
- Create: `demo/public/albums/kyoto-walk/album.json`
- Create: `demo/public/albums/kyoto-walk/preview/0001-rain-lane.svg`
- Create: `demo/public/albums/kyoto-walk/preview/0002-tea-window.svg`
- Create: `demo/public/albums/kyoto-walk/preview/0003-stone-path.svg`
- Create: `demo/public/albums/kyoto-walk/thumbnail/0001-rain-lane.svg`
- Create: `demo/public/albums/kyoto-walk/thumbnail/0002-tea-window.svg`
- Create: `demo/public/albums/kyoto-walk/thumbnail/0003-stone-path.svg`

- [ ] **Step 1: Add albums to theme config and nav**

In `demo/valaxy.config.ts`, add this nav item after the `生活` item:

```ts
      {
        text: '相册',
        link: '/albums/',
      },
```

Then add this config block inside `themeConfig` after `nav`:

```ts
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
```

- [ ] **Step 2: Create album route pages**

Create `demo/pages/albums/index.md` with:

```md
---
title: 相册
layout: albums
nav: false
comment: false
---

这些相册由 Argus 选择、清洗并发布为静态文件，Zaxon 只负责呈现公开版本。
```

Create `demo/pages/albums/kyoto-walk.md` with:

```md
---
title: Kyoto Walk
layout: album
nav: false
comment: false
---
```

- [ ] **Step 3: Create album index manifest fixture**

Create `demo/public/albums/index.json` with:

```json
{
  "schema_version": 1,
  "generated_at": "2026-07-04T00:00:00Z",
  "albums": [
    {
      "id": "demo-kyoto-walk",
      "slug": "kyoto-walk",
      "title": "Kyoto Walk",
      "description": "A quiet walk after rain.",
      "cover": "/albums/kyoto-walk/thumbnail/0001-rain-lane.svg",
      "photo_count": 3,
      "updated_at": "2026-07-04T00:00:00Z",
      "published_at": "2026-07-04T00:00:00Z",
      "sort_order": 10,
      "manifest_path": "/albums/kyoto-walk/album.json"
    }
  ]
}
```

- [ ] **Step 4: Create album detail manifest fixture**

Create `demo/public/albums/kyoto-walk/album.json` with:

```json
{
  "schema_version": 1,
  "album_id": "demo-kyoto-walk",
  "slug": "kyoto-walk",
  "title": "Kyoto Walk",
  "description": "A quiet walk after rain.",
  "cover_photo_id": "rain-lane",
  "updated_at": "2026-07-04T00:00:00Z",
  "photos": [
    {
      "id": "rain-lane",
      "original_filename": "0001-rain-lane.svg",
      "width": 1600,
      "height": 1200,
      "captured_at": "2026-07-04T08:12:00Z",
      "city": "Kyoto",
      "camera_make": "Argus Camera",
      "camera_model": "A1",
      "lens_model": "Prime 35",
      "ai_tags": ["travel", "rain"],
      "manual_tags": ["published"],
      "preview_path": "/albums/kyoto-walk/preview/0001-rain-lane.svg",
      "thumbnail_path": "/albums/kyoto-walk/thumbnail/0001-rain-lane.svg",
      "featured": false,
      "featured_order": null,
      "journal_excerpt": "Rain left the stone lane bright enough to hold the morning."
    },
    {
      "id": "tea-window",
      "original_filename": "0002-tea-window.svg",
      "width": 1600,
      "height": 1200,
      "captured_at": "2026-07-04T09:35:00Z",
      "city": "Kyoto",
      "camera_make": "Argus Camera",
      "camera_model": "A1",
      "lens_model": "Prime 35",
      "ai_tags": ["tea", "window"],
      "manual_tags": ["published"],
      "preview_path": "/albums/kyoto-walk/preview/0002-tea-window.svg",
      "thumbnail_path": "/albums/kyoto-walk/thumbnail/0002-tea-window.svg",
      "featured": true,
      "featured_order": 1,
      "journal_excerpt": "A window seat, a warm cup, and a street still waking up."
    },
    {
      "id": "stone-path",
      "original_filename": "0003-stone-path.svg",
      "width": 1600,
      "height": 1200,
      "captured_at": "2026-07-04T10:18:00Z",
      "city": "Kyoto",
      "camera_make": "Argus Camera",
      "camera_model": "A1",
      "lens_model": "Prime 35",
      "ai_tags": ["garden"],
      "manual_tags": ["published"],
      "preview_path": "/albums/kyoto-walk/preview/0003-stone-path.svg",
      "thumbnail_path": "/albums/kyoto-walk/thumbnail/0003-stone-path.svg",
      "featured": false,
      "featured_order": null,
      "journal_excerpt": null
    }
  ]
}
```

- [ ] **Step 5: Create SVG image fixtures**

Create `demo/public/albums/kyoto-walk/preview/0001-rain-lane.svg` and `demo/public/albums/kyoto-walk/thumbnail/0001-rain-lane.svg` with:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200" role="img" aria-label="Rain lane">
  <rect width="1600" height="1200" fill="#1d2730"/>
  <rect y="760" width="1600" height="440" fill="#4b5a59"/>
  <path d="M0 930 C260 830 430 860 650 790 C900 710 1120 760 1600 620 L1600 1200 L0 1200 Z" fill="#7f9388"/>
  <path d="M260 1200 L760 620 L960 620 L1260 1200 Z" fill="#c7bfa8"/>
  <path d="M360 1200 L805 640" stroke="#5e675d" stroke-width="18"/>
  <path d="M1160 1200 L920 640" stroke="#5e675d" stroke-width="18"/>
  <circle cx="1220" cy="210" r="96" fill="#f4d58d" opacity=".75"/>
  <g stroke="#d9e2df" stroke-width="5" opacity=".42">
    <path d="M180 80 L120 230"/><path d="M390 40 L330 200"/><path d="M620 100 L560 260"/><path d="M860 60 L800 230"/><path d="M1120 120 L1060 290"/><path d="M1390 70 L1330 250"/>
  </g>
</svg>
```

Create `demo/public/albums/kyoto-walk/preview/0002-tea-window.svg` and `demo/public/albums/kyoto-walk/thumbnail/0002-tea-window.svg` with:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200" role="img" aria-label="Tea window">
  <rect width="1600" height="1200" fill="#25313a"/>
  <rect x="190" y="150" width="1220" height="690" rx="18" fill="#d7caa8"/>
  <rect x="250" y="210" width="510" height="560" fill="#91aaa3"/>
  <rect x="840" y="210" width="510" height="560" fill="#78908d"/>
  <rect y="820" width="1600" height="380" fill="#6d5947"/>
  <rect x="590" y="720" width="420" height="180" rx="24" fill="#b68a61"/>
  <circle cx="800" cy="750" r="68" fill="#f1dfba"/>
  <path d="M735 745 C780 710 840 710 880 745" fill="none" stroke="#6b7d72" stroke-width="20" stroke-linecap="round"/>
  <path d="M440 320 C560 250 660 290 720 360" fill="none" stroke="#49685c" stroke-width="18" stroke-linecap="round"/>
  <path d="M940 360 C1050 270 1200 310 1280 410" fill="none" stroke="#405d56" stroke-width="18" stroke-linecap="round"/>
</svg>
```

Create `demo/public/albums/kyoto-walk/preview/0003-stone-path.svg` and `demo/public/albums/kyoto-walk/thumbnail/0003-stone-path.svg` with:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200" role="img" aria-label="Stone path">
  <rect width="1600" height="1200" fill="#24302b"/>
  <rect y="680" width="1600" height="520" fill="#60715f"/>
  <path d="M680 1200 C630 980 720 820 790 650 C850 800 990 960 1060 1200 Z" fill="#cfc7b0"/>
  <g fill="#8c8879">
    <ellipse cx="805" cy="790" rx="70" ry="38"/>
    <ellipse cx="760" cy="900" rx="88" ry="44"/>
    <ellipse cx="880" cy="1020" rx="106" ry="52"/>
    <ellipse cx="810" cy="1140" rx="130" ry="58"/>
  </g>
  <g fill="#d9b56f" opacity=".78">
    <circle cx="250" cy="520" r="18"/><circle cx="330" cy="610" r="14"/><circle cx="1220" cy="560" r="20"/><circle cx="1320" cy="660" r="13"/>
  </g>
  <path d="M190 690 C290 520 390 460 560 430" fill="none" stroke="#88a06f" stroke-width="32" stroke-linecap="round"/>
  <path d="M1040 410 C1200 460 1330 540 1430 700" fill="none" stroke="#7d9669" stroke-width="32" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 6: Run build**

Run: `pnpm build`

Expected: PASS and Valaxy generates demo output without Argus credentials or network access.

- [ ] **Step 7: Commit**

```bash
git add demo/valaxy.config.ts demo/pages/albums demo/public/albums
git commit -m "feat: add demo album fixture"
```

## Task 8: Final Verification

**Files:**
- Verify all files changed in Tasks 1-7.

- [ ] **Step 1: Run focused tests**

Run: `pnpm exec vitest run theme/composables/albums.spec.ts theme/composables/markdown.spec.ts`

Expected: PASS with all listed specs green.

- [ ] **Step 2: Run lint**

Run: `pnpm lint`

Expected: PASS with no ESLint or formatter errors.

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 4: Run production build**

Run: `pnpm build`

Expected: PASS and generated routes include `/albums/` and `/albums/kyoto-walk/`.

- [ ] **Step 5: Manual browser check**

Run: `pnpm dev`

Open `http://localhost:4859/albums/` and verify:

- The album list page displays the `Kyoto Walk` card with cover, description, count, and date.
- Clicking the card opens `/albums/kyoto-walk/`.
- The detail page displays three images in a responsive grid.
- Clicking an image opens the lightbox.
- Left and right arrow keys move between photos.
- Escape closes the lightbox.
- Clicking the backdrop closes the lightbox.
- Metadata labels with empty values are absent.

- [ ] **Step 6: Commit verification fixes if any were needed**

```bash
git add theme demo
git commit -m "fix: polish album verification issues"
```

If no files changed during verification, skip this commit.

## Self-Review

**Spec coverage:** This plan covers the Zaxon Phase 1 requirements: `/albums/` list page, `/albums/<slug>/` detail page, static JSON manifest consumption, typed manifest helpers, grid, lightbox, missing/invalid manifest states, empty album state, optional metadata omission, Phase 2 featured fields, theme config, and fixture-driven offline build. Argus implementation requirements are outside this repository and are documented as an integration assumption.

**Placeholder scan:** The plan contains no placeholder markers, no empty implementation steps, and no deferred code blocks. Each created file has concrete content or a concrete edit.

**Type consistency:** Manifest types use snake_case to match public JSON. Normalized UI types use camelCase and are consumed consistently by the composable, grid, lightbox, and layouts.
