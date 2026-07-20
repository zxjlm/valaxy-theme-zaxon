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

function photoLabel(photo: ArgusAlbumPhoto, index: number) {
  return [photo.originalFilename || `照片 ${index + 1}`, photo.livePhoto ? 'Live Photo' : '', photo.city, photo.capturedAt.slice(0, 10)]
    .filter(Boolean)
    .join(' · ')
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
      :aria-label="`打开${photoLabel(photo, index)}`"
      @click="emit('select', index)"
    >
      <img :src="photo.thumbnailPath" :alt="photo.originalFilename || `Album photo ${index + 1}`" loading="lazy">
      <span v-if="photo.livePhoto" class="argus-album-grid__live" aria-hidden="true">
        Live
      </span>
    </button>
  </div>
</template>
