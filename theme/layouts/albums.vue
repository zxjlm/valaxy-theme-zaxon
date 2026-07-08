<script setup lang="ts">
import type { ArgusAlbumSummary } from '../types/albums'
import { computed } from 'vue'
import { useAlbumIndex, useAlbumsConfig } from '../composables'

const config = useAlbumsConfig()
const albumState = useAlbumIndex()
const albums = computed(() => albumState.value.data || [])

function formatDate(value: string) {
  if (!value)
    return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return ''
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(date)
}

function albumCover(album: ArgusAlbumSummary) {
  return album.cover || album.previewThumbnails[0] || ''
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
        相册列表暂时无法加载。
      </p>
      <p v-else-if="!albums.length" class="argus-album-empty">
        这里还没有公开相册。
      </p>

      <div v-else class="argus-albums__list" :data-count="albums.length">
        <article v-for="album in albums" :key="album.id" class="argus-album-card">
          <RouterLink class="argus-album-card__link" :to="`/albums/${album.slug}`" :aria-label="`打开相册 ${album.title}`" />

          <div class="argus-album-card__sheet">
            <img
              v-if="albumCover(album)"
              class="argus-album-card__cover"
              :src="albumCover(album)"
              :alt="album.title"
              loading="lazy"
            >
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
    </div>
  </Layout>
</template>
