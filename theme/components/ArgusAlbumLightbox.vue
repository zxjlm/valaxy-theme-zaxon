<script setup lang="ts">
import type { ArgusAlbumPhoto } from '../types/albums'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

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
const dialog = ref<HTMLElement | null>(null)
const videoLoadFailed = ref(false)
let previousFocusedElement: HTMLElement | null = null

const imageStyle = computed(() => {
  const current = photo.value
  if (!current?.width || !current.height)
    return {}

  return {
    aspectRatio: `${current.width} / ${current.height}`,
  }
})

const metadata = computed(() => {
  const current = photo.value
  if (!current)
    return []

  return [
    ['Date', current.capturedAt.slice(0, 10)],
    ['Place', current.city],
    ['Camera', current.camera],
    ['Lens', current.lens],
    ['Focal length', current.focalLength],
    ['Aperture', current.aperture],
    ['Shutter', current.shutterSpeed],
    ['ISO', current.iso],
    ['Live Photo', current.livePhoto?.durationMs ? `${(current.livePhoto.durationMs / 1000).toFixed(1)}s` : current.livePhoto ? 'Available' : ''],
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

  switch (event.key) {
    case 'Escape':
      emit('close')
      break
    case 'ArrowLeft':
      previous()
      break
    case 'ArrowRight':
      next()
      break
    case 'Tab':
      trapFocus(event)
      break
  }
}

function syncBodyClass(open: boolean) {
  if (typeof document === 'undefined')
    return

  document.body.classList.toggle('argus-lightbox-open', open)
}

function getFocusableElements() {
  return Array.from(
    dialog.value?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  ).filter(element => !element.hasAttribute('disabled') && element.tabIndex >= 0)
}

function restoreFocus() {
  if (typeof document === 'undefined')
    return

  previousFocusedElement?.focus()
  previousFocusedElement = null
}

function syncFocus(open: boolean) {
  if (typeof document === 'undefined')
    return

  if (open) {
    previousFocusedElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

    nextTick(() => {
      if (!isOpen.value)
        return

      const focusTarget = getFocusableElements()[0] ?? dialog.value
      focusTarget?.focus()
    })

    return
  }

  restoreFocus()
}

function trapFocus(event: KeyboardEvent) {
  if (typeof document === 'undefined')
    return

  const focusableElements = getFocusableElements()
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  const activeElement = document.activeElement

  if (!firstElement || !lastElement) {
    event.preventDefault()
    dialog.value?.focus()
    return
  }

  if (!dialog.value?.contains(activeElement)) {
    event.preventDefault()
    if (event.shiftKey)
      lastElement.focus()
    else
      firstElement.focus()
    return
  }

  if (event.shiftKey && activeElement === firstElement) {
    event.preventDefault()
    lastElement.focus()
    return
  }

  if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}

watch(isOpen, syncBodyClass, { immediate: true })
watch(isOpen, syncFocus, { immediate: true })
watch(photo, () => {
  videoLoadFailed.value = false
})

if (typeof window !== 'undefined')
  window.addEventListener('keydown', onKeydown)

onBeforeUnmount(() => {
  if (isOpen.value)
    restoreFocus()
  if (typeof document !== 'undefined')
    document.body.classList.remove('argus-lightbox-open')
  if (typeof window !== 'undefined')
    window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="photo"
      ref="dialog"
      class="argus-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="照片预览"
      tabindex="-1"
    >
      <button class="argus-lightbox__backdrop" type="button" tabindex="-1" aria-label="关闭照片预览" @click="emit('close')" />

      <figure class="argus-lightbox__figure">
        <button class="argus-lightbox__close" type="button" aria-label="关闭照片预览" @click="emit('close')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <div class="argus-lightbox__image">
          <div class="argus-lightbox__image-frame" :style="imageStyle">
            <video
              v-if="photo.livePhoto && !videoLoadFailed"
              class="argus-lightbox__video"
              :src="photo.livePhoto.videoPath"
              :poster="photo.previewPath"
              :width="photo.width"
              :height="photo.height"
              controls
              playsinline
              preload="metadata"
              :aria-label="`${photo.originalFilename || 'Album photo'} 的实况照片`"
              @error="videoLoadFailed = true"
            />
            <img
              v-else
              :src="photo.previewPath"
              :alt="photo.originalFilename || 'Album photo'"
              :width="photo.width"
              :height="photo.height"
            >
          </div>
        </div>

        <figcaption class="argus-lightbox__caption">
          <p class="argus-lightbox__eyebrow">
            Field note
          </p>

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
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 18 9 12l6-6" />
          </svg>
        </button>
        <button class="argus-lightbox__nav argus-lightbox__nav--next" type="button" aria-label="下一张照片" @click="next">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </figure>
    </div>
  </Teleport>
</template>
