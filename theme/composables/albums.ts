import type { MaybeRef } from 'vue'
import type {
  ArgusAlbumDetail,
  ArgusAlbumIndexManifest,
  ArgusAlbumManifest,
  ArgusAlbumPhoto,
  ArgusAlbumPhotoManifest,
  ArgusAlbumsConfig,
  ArgusAlbumsState,
  ArgusAlbumSummary,
  ArgusAlbumSummaryManifest,
} from '../types/albums'
import { computed, onMounted, ref, toValue, watch } from 'vue'
import { useThemeConfig } from './config'

export const defaultAlbumsConfig: ArgusAlbumsConfig = {
  enable: true,
  indexPath: '/albums/index.json',
  title: '相册',
  description: '从 Argus 发布的照片记录。',
  featured: { enable: false, limit: 6 },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown): string {
  return value == null ? '' : String(value)
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function normalizeTags(photo: ArgusAlbumPhotoManifest): string[] {
  const tags: string[] = []
  const seen = new Set<string>()

  for (const tag of [...asArray(photo.ai_tags), ...asArray(photo.manual_tags)]) {
    const normalizedTag = asString(tag)

    if (!normalizedTag || seen.has(normalizedTag))
      continue

    seen.add(normalizedTag)
    tags.push(normalizedTag)
  }

  return tags
}

function normalizeAlbumSummary(album: ArgusAlbumSummaryManifest): ArgusAlbumSummary {
  return {
    id: asString(album.id),
    slug: asString(album.slug),
    title: asString(album.title),
    description: asString(album.description),
    cover: asString(album.cover),
    photoCount: asNumber(album.photo_count) ?? 0,
    updatedAt: asString(album.updated_at),
    publishedAt: asString(album.published_at),
    sortOrder: asNumber(album.sort_order) ?? 0,
    manifestPath: asString(album.manifest_path),
  }
}

function compareAlbums(first: ArgusAlbumSummary, second: ArgusAlbumSummary): number {
  if (first.sortOrder !== second.sortOrder)
    return first.sortOrder - second.sortOrder

  const firstTime = Date.parse(first.publishedAt) || 0
  const secondTime = Date.parse(second.publishedAt) || 0

  if (firstTime !== secondTime)
    return secondTime - firstTime

  return first.title.localeCompare(second.title)
}

function normalizeAlbumPhoto(photo: ArgusAlbumPhotoManifest): ArgusAlbumPhoto {
  const previewPath = asString(photo.preview_path)
  const camera = [photo.camera_make, photo.camera_model]
    .map(part => asString(part).trim())
    .filter(Boolean)
    .join(' ')

  return {
    id: asString(photo.id),
    originalFilename: asString(photo.original_filename),
    width: asNumber(photo.width),
    height: asNumber(photo.height),
    capturedAt: asString(photo.captured_at),
    city: asString(photo.city),
    camera,
    lens: asString(photo.lens_model),
    tags: normalizeTags(photo),
    previewPath,
    thumbnailPath: asString(photo.thumbnail_path) || previewPath,
    featured: photo.featured === true,
    featuredOrder: asNumber(photo.featured_order) ?? null,
    journalExcerpt: asString(photo.journal_excerpt),
  }
}

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(path)

  if (!response.ok)
    throw new Error(`Failed to load ${path}`)

  return response.json()
}

export function normalizeAlbumIndex(input: unknown): ArgusAlbumSummary[] {
  if (!isRecord(input) || input.schema_version !== 1)
    throw new Error('Unsupported album index schema')

  const manifest = input as unknown as ArgusAlbumIndexManifest

  if (!Array.isArray(manifest.albums))
    throw new Error('Album index is missing albums')

  return manifest.albums
    .map(normalizeAlbumSummary)
    .sort(compareAlbums)
}

export function normalizeAlbumDetail(input: unknown): ArgusAlbumDetail {
  if (!isRecord(input) || input.schema_version !== 1)
    throw new Error('Unsupported album detail schema')

  const manifest = input as unknown as ArgusAlbumManifest

  if (!Array.isArray(manifest.photos))
    throw new Error('Album detail is missing photos')

  return {
    albumId: asString(manifest.album_id),
    slug: asString(manifest.slug),
    title: asString(manifest.title),
    description: asString(manifest.description),
    coverPhotoId: asString(manifest.cover_photo_id),
    updatedAt: asString(manifest.updated_at),
    photos: manifest.photos
      .map(normalizeAlbumPhoto)
      .filter(photo => photo.previewPath),
  }
}

export function resolveAlbumManifestPath(slug: string, albums: ArgusAlbumSummary[]): string {
  const album = albums.find(album => album.slug === slug)

  return album ? album.manifestPath : `/albums/${slug}/album.json`
}

export function featuredPhotos(
  albums: ArgusAlbumDetail[],
  limit = defaultAlbumsConfig.featured.limit,
): ArgusAlbumPhoto[] {
  return albums
    .flatMap(album => album.photos)
    .filter(photo => photo.featured)
    .sort((first, second) => (first.featuredOrder ?? Number.MAX_SAFE_INTEGER) - (second.featuredOrder ?? Number.MAX_SAFE_INTEGER))
    .slice(0, limit)
}

export function useAlbumsConfig() {
  const themeConfig = useThemeConfig()

  return computed<ArgusAlbumsConfig>(() => ({
    ...defaultAlbumsConfig,
    ...themeConfig.value?.albums,
    featured: {
      ...defaultAlbumsConfig.featured,
      ...themeConfig.value?.albums?.featured,
    },
  }))
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
      error.value = err instanceof Error ? err.message : 'Failed to load album index'
      data.value = null
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

export function useAlbumDetail(slug: MaybeRef<string>, manifestPath?: MaybeRef<string | undefined>) {
  const data = ref<ArgusAlbumDetail | null>(null)
  const pending = ref(false)
  const error = ref('')
  let requestId = 0
  const shouldWaitForManifestPath = manifestPath !== undefined

  async function loadAlbumDetail(currentSlug: string, currentManifestPath?: string) {
    if (!currentSlug || (shouldWaitForManifestPath && currentManifestPath === undefined)) {
      data.value = null
      pending.value = false
      error.value = ''
      return
    }

    const currentRequestId = ++requestId

    pending.value = true
    error.value = ''

    try {
      const albumDetail = normalizeAlbumDetail(await fetchJson(currentManifestPath ?? `/albums/${currentSlug}/album.json`))
      if (currentRequestId === requestId)
        data.value = albumDetail
    }
    catch (err) {
      if (currentRequestId === requestId) {
        error.value = err instanceof Error ? err.message : 'Failed to load album detail'
        data.value = null
      }
    }
    finally {
      if (currentRequestId === requestId)
        pending.value = false
    }
  }

  onMounted(() => {
    watch(
      () => [toValue(slug), toValue(manifestPath)] as const,
      ([currentSlug, currentManifestPath]) => loadAlbumDetail(currentSlug, currentManifestPath),
      { immediate: true },
    )
  })

  return computed<ArgusAlbumsState<ArgusAlbumDetail>>(() => ({
    data: data.value,
    pending: pending.value,
    error: error.value,
  }))
}
