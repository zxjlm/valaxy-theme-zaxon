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
