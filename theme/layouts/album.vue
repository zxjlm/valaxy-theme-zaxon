<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import ArgusAlbumGrid from '../components/ArgusAlbumGrid.vue'
import ArgusAlbumLightbox from '../components/ArgusAlbumLightbox.vue'
import { resolveAlbumManifestPath, useAlbumDetail, useAlbumIndex } from '../composables'

const route = useRoute()
const slug = computed(() => String(route.params.slug || route.path.split('/').filter(Boolean).at(-1) || ''))
const albumIndexState = useAlbumIndex()
const manifestPath = computed(() => {
  const albums = albumIndexState.value.data
  if (!albums)
    return undefined
  return resolveAlbumManifestPath(slug.value, albums)
})
const albumState = useAlbumDetail(slug, manifestPath)
const album = computed(() => albumState.value.data)
const activeIndex = ref(-1)
const isPending = computed(() => albumIndexState.value.pending || albumState.value.pending)
const loadError = computed(() => albumIndexState.value.error || albumState.value.error)
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

function formatDate(value: string) {
  if (!value)
    return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return ''
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(date)
}
</script>

<template>
  <Layout>
    <article class="field-catalog argus-album-detail">
      <RouterLink class="argus-album-detail__back" to="/albums">
        ← 返回相册
      </RouterLink>

      <p v-if="isPending" class="argus-album-empty">
        正在装入相册。
      </p>
      <p v-else-if="loadError" class="argus-album-empty">
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
          <p class="field-catalog__count argus-album-detail__facts">
            <span>{{ album.photos.length }} photos</span>
            <span v-if="dateSummary">{{ dateSummary }}</span>
            <span v-if="placeSummary">{{ placeSummary }}</span>
          </p>
        </header>

        <ArgusAlbumGrid :photos="album.photos" @select="activeIndex = $event" />
        <ArgusAlbumLightbox :photos="album.photos" :active-index="activeIndex" @update="activeIndex = $event" @close="activeIndex = -1" />
      </template>
    </article>
  </Layout>
</template>
