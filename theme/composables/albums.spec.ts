import { describe, expect, it } from 'vitest'

import {
  defaultAlbumsConfig,
  featuredPhotos,
  normalizeAlbumDetail,
  normalizeAlbumIndex,
  resolveAlbumManifestPath,
} from './albums'

describe('album manifest composable', () => {
  it('normalizes and sorts album index manifests', () => {
    expect(normalizeAlbumIndex({
      schema_version: 1,
      albums: [
        {
          id: 'autumn',
          slug: 'autumn-notes',
          title: 'Autumn Notes',
          description: null,
          cover: null,
          photo_count: 6,
          updated_at: null,
          published_at: '2026-01-02T00:00:00.000Z',
          sort_order: 2,
          manifest_path: '/albums/autumn-notes/album.json',
        },
        {
          id: 'spring',
          slug: 'spring-field',
          title: 'Spring Field',
          description: 'Field walk',
          cover: '/albums/spring/cover.jpg',
          photo_count: 4,
          updated_at: '2026-03-01T00:00:00.000Z',
          published_at: '2026-04-02T00:00:00.000Z',
          sort_order: 1,
          manifest_path: '/albums/spring-field/album.json',
        },
        {
          id: 'rain',
          slug: 'rain-map',
          title: 'Rain Map',
          photo_count: 3,
          published_at: '2026-04-03T00:00:00.000Z',
          sort_order: 1,
          manifest_path: '/albums/rain-map/album.json',
        },
        {
          id: 'a-title',
          slug: 'a-title',
          title: 'A Title',
          photo_count: 1,
          published_at: '2026-04-03T00:00:00.000Z',
          sort_order: 1,
          manifest_path: '/albums/a-title/album.json',
        },
      ],
    }).map(album => ({
      slug: album.slug,
      description: album.description,
      cover: album.cover,
      updatedAt: album.updatedAt,
    }))).toEqual([
      {
        slug: 'a-title',
        description: '',
        cover: '',
        updatedAt: '',
      },
      {
        slug: 'rain-map',
        description: '',
        cover: '',
        updatedAt: '',
      },
      {
        slug: 'spring-field',
        description: 'Field walk',
        cover: '/albums/spring/cover.jpg',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
      {
        slug: 'autumn-notes',
        description: '',
        cover: '',
        updatedAt: '',
      },
    ])
  })

  it('rejects unsupported album index schema and missing albums', () => {
    expect(() => normalizeAlbumIndex({ schema_version: 2, albums: [] }))
      .toThrow('Unsupported album index schema')
    expect(() => normalizeAlbumIndex({ schema_version: 1 }))
      .toThrow('Album index is missing albums')
  })

  it('normalizes album detail manifests', () => {
    const detail = normalizeAlbumDetail({
      schema_version: 1,
      album_id: 'field',
      slug: 'field-notes',
      title: 'Field Notes',
      description: null,
      cover_photo_id: null,
      updated_at: null,
      photos: [
        {
          id: 'empty-preview',
          preview_path: '',
        },
        {
          id: 'photo-1',
          original_filename: null,
          width: null,
          height: 1200,
          captured_at: null,
          city: null,
          camera_make: 'Ricoh',
          camera_model: 'GR III',
          lens_model: null,
          ai_tags: ['field', 'light', 'field'],
          manual_tags: ['light', 'journal'],
          preview_path: '/albums/field/photo-1.jpg',
          thumbnail_path: null,
          featured: true,
          featured_order: null,
          journal_excerpt: null,
        },
        {
          id: 'photo-2',
          original_filename: 'photo-2.jpg',
          width: 1600,
          camera_make: 'Fujifilm',
          ai_tags: [],
          manual_tags: ['green'],
          preview_path: '/albums/field/photo-2.jpg',
          thumbnail_path: '/albums/field/thumb-2.jpg',
          featured_order: 4,
          journal_excerpt: 'Soft rain',
        },
      ],
    })

    expect(detail).toEqual({
      albumId: 'field',
      slug: 'field-notes',
      title: 'Field Notes',
      description: '',
      coverPhotoId: '',
      updatedAt: '',
      photos: [
        {
          id: 'photo-1',
          originalFilename: '',
          width: undefined,
          height: 1200,
          capturedAt: '',
          city: '',
          camera: 'Ricoh GR III',
          lens: '',
          tags: ['field', 'light', 'journal'],
          previewPath: '/albums/field/photo-1.jpg',
          thumbnailPath: '/albums/field/photo-1.jpg',
          featured: true,
          featuredOrder: null,
          journalExcerpt: '',
        },
        {
          id: 'photo-2',
          originalFilename: 'photo-2.jpg',
          width: 1600,
          height: undefined,
          capturedAt: '',
          city: '',
          camera: 'Fujifilm',
          lens: '',
          tags: ['green'],
          previewPath: '/albums/field/photo-2.jpg',
          thumbnailPath: '/albums/field/thumb-2.jpg',
          featured: false,
          featuredOrder: 4,
          journalExcerpt: 'Soft rain',
        },
      ],
    })
  })

  it('rejects unsupported album detail schema and missing photos', () => {
    expect(() => normalizeAlbumDetail({ schema_version: 2, photos: [] }))
      .toThrow('Unsupported album detail schema')
    expect(() => normalizeAlbumDetail({ schema_version: 1 }))
      .toThrow('Album detail is missing photos')
  })

  it('exposes the default albums config', () => {
    expect(defaultAlbumsConfig).toEqual({
      enable: true,
      indexPath: '/albums/index.json',
      title: '相册',
      description: '从 Argus 发布的照片记录。',
      featured: { enable: false, limit: 6 },
    })
  })

  it('resolves album manifest paths from the index or slug fallback', () => {
    const albums = normalizeAlbumIndex({
      schema_version: 1,
      albums: [
        {
          id: 'field',
          slug: 'field-notes',
          title: 'Field Notes',
          photo_count: 1,
          manifest_path: '/custom/field.json',
        },
        {
          id: 'empty',
          slug: 'empty-path',
          title: 'Empty Path',
          photo_count: 1,
          manifest_path: null,
        },
      ],
    })

    expect(resolveAlbumManifestPath('field-notes', albums)).toBe('/custom/field.json')
    expect(resolveAlbumManifestPath('empty-path', albums)).toBe('')
    expect(resolveAlbumManifestPath('missing', albums)).toBe('/albums/missing/album.json')
  })

  it('returns featured photos sorted by order and limited', () => {
    const albums = [
      normalizeAlbumDetail({
        schema_version: 1,
        album_id: 'field',
        slug: 'field-notes',
        title: 'Field Notes',
        photos: [
          {
            id: 'last',
            preview_path: '/last.jpg',
            featured: true,
            featured_order: 3,
          },
          {
            id: 'not-featured',
            preview_path: '/skip.jpg',
            featured: false,
            featured_order: 1,
          },
        ],
      }),
      normalizeAlbumDetail({
        schema_version: 1,
        album_id: 'rain',
        slug: 'rain-map',
        title: 'Rain Map',
        photos: [
          {
            id: 'first',
            preview_path: '/first.jpg',
            featured: true,
            featured_order: 1,
          },
          {
            id: 'second',
            preview_path: '/second.jpg',
            featured: true,
            featured_order: 2,
          },
        ],
      }),
    ]

    expect(featuredPhotos(albums, 2).map(photo => photo.id)).toEqual(['first', 'second'])
  })
})
