<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import ArgusAlbumGrid from '../components/ArgusAlbumGrid.vue'
import ArgusAlbumLightbox from '../components/ArgusAlbumLightbox.vue'
import { useAlbumDetail } from '../composables'

const route = useRoute()
const slug = computed(() => String(route.params.slug || route.path.split('/').filter(Boolean).at(-1) || ''))
const albumState = useAlbumDetail(slug)
const album = computed(() => albumState.value.data)
const activeIndex = ref(-1)

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
            {{ album.photos.length }} photos<time v-if="album.updatedAt" :datetime="album.updatedAt"> · {{ formatDate(album.updatedAt) }}</time>
          </p>
        </header>

        <ArgusAlbumGrid :photos="album.photos" @select="activeIndex = $event" />
        <ArgusAlbumLightbox :photos="album.photos" :active-index="activeIndex" @update="activeIndex = $event" @close="activeIndex = -1" />
      </template>
    </article>
  </Layout>
</template>
