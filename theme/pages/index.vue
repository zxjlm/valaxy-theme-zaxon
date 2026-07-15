<script lang="ts" setup>
import type { AlbumPreviewPhoto, ConnectionInfo } from '../composables'
import { usePostList, useSiteConfig } from 'valaxy'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import flowerDecor from '../assets/field-notes/decor-flower-a.png'

import rockDecor from '../assets/field-notes/decor-rocks.png'
import cameraIcon from '../assets/field-notes/icon-camera.png'
import compassIcon from '../assets/field-notes/icon-compass.png'
import devIcon from '../assets/field-notes/icon-dev.png'
import lifeIcon from '../assets/field-notes/icon-life.png'
import notebookIcon from '../assets/field-notes/icon-notebook.png'
import {
  albumPreviewPhotos,
  heroVariant,
  heroPreviewUrl,
  isCurrentHeroRequest,
  pickRandomItems,
  shouldLoadHeroQuality,
  useAlbumIndex,
  useFieldEntries,
  useThemeConfig,
} from '../composables'

const siteConfig = useSiteConfig()
const themeConfig = useThemeConfig()
const posts = usePostList()
const { isLife } = useFieldEntries()
const albumState = useAlbumIndex()

const previewHeroImage = ref('')
const fullHeroImage = ref('')
const isHeroFullReady = ref(false)
let heroMediaQuery: MediaQueryList | undefined
let themeObserver: MutationObserver | undefined
let heroRequest = 0

const visiblePosts = computed(() => posts.value.filter(post => !post.draft))
const devPosts = computed(() => visiblePosts.value.filter(post => !isLife(post)))
const lifePosts = computed(() => visiblePosts.value.filter(post => isLife(post)))
const latestPosts = computed(() => visiblePosts.value.slice(0, 5))
const albumPhotos = computed(() => albumPreviewPhotos(albumState.value.data || []))
const epiphanyPhotos = ref<AlbumPreviewPhoto[]>([])

watch(albumPhotos, (photos) => {
  epiphanyPhotos.value = pickRandomItems(photos, 2)
}, { immediate: true })

function connectionInfo(): ConnectionInfo | undefined {
  return (navigator as Navigator & { connection?: ConnectionInfo }).connection
}

function scheduleFullHeroLoad(src: string, request: number) {
  const load = async () => {
    const image = new Image()
    image.src = src

    try {
      await image.decode()
      if (!isCurrentHeroRequest(heroRequest, request))
        return

      fullHeroImage.value = src
      await nextTick()
      window.requestAnimationFrame(() => {
        if (isCurrentHeroRequest(heroRequest, request) && fullHeroImage.value === src)
          isHeroFullReady.value = true
      })
    }
    catch {
      // Keep the preview visible if the full-resolution image cannot load or decode.
    }
  }

  if (typeof window.requestIdleCallback === 'function')
    window.requestIdleCallback(load, { timeout: 1500 })
  else
    window.setTimeout(load, 0)
}

function syncHeroImages() {
  const variant = heroVariant(
    document.documentElement.classList.contains('dark'),
    Boolean(heroMediaQuery?.matches),
  )
  const images = themeConfig.value.hero
  const key = `${variant.viewport}${variant.theme === 'light' ? 'Light' : 'Dark'}` as const
  const fullImage = images[key]
  const previewImage = heroPreviewUrl(images[`${key}Preview`])

  previewHeroImage.value = previewImage || ''
  fullHeroImage.value = ''
  isHeroFullReady.value = false

  const request = ++heroRequest
  if (!previewImage) {
    fullHeroImage.value = fullImage
    isHeroFullReady.value = true
  }
  else if (shouldLoadHeroQuality(connectionInfo())) {
    scheduleFullHeroLoad(fullImage, request)
  }
}

onMounted(() => {
  heroMediaQuery = window.matchMedia('(max-width: 640px)')
  syncHeroImages()

  heroMediaQuery.addEventListener('change', syncHeroImages)
  themeObserver = new MutationObserver(syncHeroImages)
  themeObserver.observe(document.documentElement, {
    attributeFilter: ['class', 'data-theme'],
    attributes: true,
  })
})

onBeforeUnmount(() => {
  heroMediaQuery?.removeEventListener('change', syncHeroImages)
  themeObserver?.disconnect()
})
</script>

<template>
  <div class="field-home">
    <section class="field-hero" aria-labelledby="field-hero-title">
      <img v-if="previewHeroImage" class="field-hero__image field-hero__image--preview" :src="previewHeroImage" alt="" aria-hidden="true">
      <img
        v-if="fullHeroImage"
        class="field-hero__image field-hero__image--full"
        :class="{ 'field-hero__image--ready': isHeroFullReady }"
        :src="fullHeroImage"
        alt=""
        aria-hidden="true"
      >
      <div class="field-hero__overlay" />
      <div class="field-hero__content">
        <p class="field-kicker">
          Zaxon / field notes theme
        </p>
        <h1 id="field-hero-title" class="field-hero__title">
          {{ siteConfig.title || 'Zaxon' }}
        </h1>
        <p class="field-hero__subtitle">
          {{ siteConfig.subtitle || '记录代码与生活，收集微小而确定的光。' }}
        </p>
        <p class="field-hero__copy">
          思考、记录、无限进步。
        </p>
        <div class="field-hero__trail" aria-label="内容比例">
          <span>DEV</span>
          <span>LIFE</span>
          <span>NOTES / PHOTOS / QUOTES</span>
        </div>
        <div class="field-hero__actions">
          <RouterLink class="field-button field-button--dev" to="/tech/">
            DEV LOG
          </RouterLink>
          <RouterLink class="field-button field-button--life" to="/notes/">
            LIFE LOG
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="field-section field-log-gates" aria-labelledby="field-log-gates-title">
      <div class="field-section__head">
        <div>
          <p class="field-kicker">
            World entries
          </p>
          <h2 id="field-log-gates-title" class="field-section__title">
            Balance
          </h2>
          <p class="field-section__summary">
            均衡
          </p>
        </div>
      </div>

      <div class="field-gate-grid">
        <RouterLink class="field-gate field-gate--dev" to="/tech/">
          <img class="field-gate__icon" :src="devIcon" alt="" loading="lazy">
          <div>
            <p class="field-gate__eyebrow">
              DEV LOG
            </p>
            <h3>开发记录</h3>
            <p>记录技术探索、开发心得与工具实践</p>
            <div class="field-gate__tags">
              <span>代码</span>
              <span>架构</span>
              <span>工具</span>
              <span>{{ devPosts.length }} 篇</span>
            </div>
          </div>
          <span class="field-gate__arrow" aria-hidden="true">›</span>
        </RouterLink>

        <RouterLink class="field-gate field-gate--life" to="/notes/">
          <img class="field-gate__icon" :src="lifeIcon" alt="" loading="lazy">
          <div>
            <p class="field-gate__eyebrow">
              LIFE LOG
            </p>
            <h3>生活记录</h3>
            <p>收集照片、阅读、音乐与旅途中的片段</p>
            <div class="field-gate__tags">
              <span>随笔</span>
              <span>旅行</span>
              <span>阅读</span>
              <span>{{ lifePosts.length }} 篇</span>
            </div>
          </div>
          <span class="field-gate__arrow" aria-hidden="true">›</span>
        </RouterLink>
      </div>
    </section>

    <section class="field-section" aria-labelledby="field-finds-title">
      <div class="field-section__head">
        <div>
          <p class="field-kicker">
            Album finds
          </p>
          <h2 id="field-finds-title" class="field-section__title">
            Epiphany
          </h2>
          <p class="field-section__summary">
            相册拾光
          </p>
        </div>
        <RouterLink class="field-section__more" to="/albums/">
          查看全部 <span aria-hidden="true">→</span>
        </RouterLink>
      </div>

      <p v-if="albumState.pending" class="field-epiphany__status">
        正在挑选两张照片。
      </p>
      <p v-else-if="albumState.error || !epiphanyPhotos.length" class="field-epiphany__status">
        相册暂时还没有可展示的照片。
      </p>

      <div v-else class="field-epiphany-grid">
        <RouterLink
          v-for="(photo, index) in epiphanyPhotos"
          :key="photo.src"
          class="field-epiphany-card"
          :data-featured="index === 0"
          :to="`/albums/${photo.albumSlug}`"
        >
          <img :src="photo.src" :alt="`${photo.albumTitle} 相册照片`" :loading="index === 0 ? 'eager' : 'lazy'" decoding="async">
          <span class="field-epiphany-card__shade" aria-hidden="true" />
          <span class="field-epiphany-card__body">
            <span class="field-chip" data-kind="life">Photo</span>
            <strong>{{ photo.albumTitle }}</strong>
            <span>打开相册 <span aria-hidden="true">→</span></span>
          </span>
        </RouterLink>
      </div>
    </section>

    <section class="field-section" aria-labelledby="field-latest-title">
      <div class="field-section__head">
        <div>
          <p class="field-kicker">
            Latest articles
          </p>
          <h2 id="field-latest-title" class="field-section__title">
            Journal
          </h2>
          <p class="field-section__summary">
            冒险日志
          </p>
        </div>
      </div>

      <div class="field-latest-panel">
        <RouterLink
          v-for="post in latestPosts"
          :key="post.path"
          class="field-latest-row"
          :to="post.path || ''"
        >
          <img class="field-latest-row__icon" :src="isLife(post) ? cameraIcon : notebookIcon" alt="" loading="lazy">
          <span class="field-chip" :data-kind="isLife(post) ? 'life' : 'dev'">
            {{ isLife(post) ? '生活' : '开发' }}
          </span>
          <span class="field-latest-row__title">{{ post.title }}</span>
          <StarterDate :date="post.date" />
          <span aria-hidden="true">›</span>
        </RouterLink>
      </div>
    </section>

    <section class="field-section field-camp-strip" aria-label="Field notes decorations">
      <img :src="flowerDecor" alt="" loading="lazy">
      <span />
      <img :src="compassIcon" alt="" loading="lazy">
      <span />
      <img :src="rockDecor" alt="" loading="lazy">
    </section>
  </div>
</template>

<route lang="yaml">
# default is home
meta:
  layout: home
</route>
