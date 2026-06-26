<script lang="ts" setup>
import type { Post } from 'valaxy'
import { usePostList, useSiteConfig } from 'valaxy'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const siteConfig = useSiteConfig()
const posts = usePostList()

import devIcon from '../assets/field-notes/icon-dev.png'
import lifeIcon from '../assets/field-notes/icon-life.png'
import notebookIcon from '../assets/field-notes/icon-notebook.png'
import cameraIcon from '../assets/field-notes/icon-camera.png'
import compassIcon from '../assets/field-notes/icon-compass.png'
import flowerDecor from '../assets/field-notes/decor-flower-a.png'
import rockDecor from '../assets/field-notes/decor-rocks.png'
import thumbLake from '../assets/field-notes/thumb-lake.png'
import thumbCoffee from '../assets/field-notes/thumb-coffee.png'
import thumbCamp from '../assets/field-notes/thumb-camp.png'
import heroFieldDesktopLight from '../assets/field-notes/hero-field-desktop-light.png'
import heroFieldMobileLight from '../assets/field-notes/hero-field-mobile-light.png'
import heroFieldDesktopDark from '../assets/field-notes/hero-field-desktop-dark.png'
import heroFieldMobileDark from '../assets/field-notes/hero-field-mobile-dark.png'

const heroImages = {
  light: {
    desktop: heroFieldDesktopLight,
    mobile: heroFieldMobileLight,
  },
  dark: {
    desktop: heroFieldDesktopDark,
    mobile: heroFieldMobileDark,
  },
}

const heroImage = ref('')
let heroMediaQuery: MediaQueryList | undefined
let themeObserver: MutationObserver | undefined

function asArray(value: unknown) {
  if (Array.isArray(value))
    return value.map(item => String(item))
  return value ? [String(value)] : []
}

function fieldValue(post: Post, key: string) {
  return (post as any)[key] ?? (post as any).frontmatter?.[key]
}

function postText(post: Post) {
  return [
    post.title,
    post.excerpt,
    fieldValue(post, 'type'),
    ...asArray((post as any).tags),
    ...asArray((post as any).categories),
  ].join(' ').toLowerCase()
}

function entryKind(post: Post) {
  const text = postText(post)

  if (/photo|摄影|旅行|照片|胶片/.test(text))
    return 'photo'
  if (/quote|摘录|引用|句子/.test(text))
    return 'quote'
  if (/note|笔记|备忘|随记|灵感/.test(text))
    return 'note'
  if (/life|生活|阅读|音乐|咖啡/.test(text))
    return 'life'

  return 'article'
}

function entryLabel(post: Post) {
  return {
    article: 'ARTICLE',
    life: 'LIFE',
    note: 'NOTE',
    photo: 'PHOTO',
    quote: 'QUOTE',
  }[entryKind(post)]
}

function isLife(post: Post) {
  return ['life', 'photo', 'quote'].includes(entryKind(post))
}

function plainText(value: unknown) {
  return String(value || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function postSummary(post: Post) {
  const excerpt = plainText(post.excerpt)
  if (excerpt)
    return excerpt

  return {
    article: '整理一个具体问题的来路、取舍和最终实践。',
    life: '把生活片段放回同一份长期可读的观察手册。',
    note: '短一点的开发备忘，保留当时的判断和线索。',
    photo: '用照片记下天气、路径和当时看见的光。',
    quote: '摘下一句还值得反复咀嚼的话，留给之后的自己。',
  }[entryKind(post)]
}

const visiblePosts = computed(() => posts.value.filter(post => !post.draft))
const devPosts = computed(() => visiblePosts.value.filter(post => !isLife(post)).slice(0, 3))
const lifePosts = computed(() => visiblePosts.value.filter(post => isLife(post)).slice(0, 3))
const recentPosts = computed(() => visiblePosts.value.slice(0, 4))
const latestPosts = computed(() => visiblePosts.value.slice(0, 5))
const heroStyle = computed(() => ({
  '--field-hero-image': heroImage.value ? `url(${heroImage.value})` : 'none',
}))

const fallbackFinds = [
  {
    label: 'PHOTO',
    title: '雨后湖边',
    summary: '旅行随拍，保留真实照片的安静质感。',
    image: thumbLake,
  },
  {
    label: 'NOTE',
    title: '一杯平静的时间',
    summary: '用短句记录当下正在使用的工具与阅读。',
    image: thumbCoffee,
  },
  {
    label: 'LIFE',
    title: '夜间营地记录',
    summary: '把生活片段放回同一个长期可读的世界。',
    image: thumbCamp,
  },
]

function syncHeroImage() {
  const isDark = document.documentElement.classList.contains('dark')
  const theme = isDark ? 'dark' : 'light'
  const size = heroMediaQuery?.matches ? 'mobile' : 'desktop'
  heroImage.value = heroImages[theme][size]
}

onMounted(() => {
  heroMediaQuery = window.matchMedia('(max-width: 640px)')
  syncHeroImage()

  heroMediaQuery.addEventListener('change', syncHeroImage)
  themeObserver = new MutationObserver(syncHeroImage)
  themeObserver.observe(document.documentElement, {
    attributeFilter: ['class', 'data-theme'],
    attributes: true,
  })
})

onBeforeUnmount(() => {
  heroMediaQuery?.removeEventListener('change', syncHeroImage)
  themeObserver?.disconnect()
})
</script>

<template>
  <div class="field-home">
    <section class="field-hero" :style="heroStyle" aria-labelledby="field-hero-title">
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
          在开发与生活之间，安放思考、记录与热爱。
        </p>
        <div class="field-hero__trail" aria-label="内容比例">
          <span>DEV</span>
          <span>LIFE</span>
          <span>NOTES / PHOTOS / QUOTES</span>
        </div>
        <div class="field-hero__actions">
          <RouterLink class="field-button field-button--dev" to="/categories/">
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
            技术 与 生活
          </p>
        </div>
      </div>

      <div class="field-gate-grid">
        <RouterLink class="field-gate field-gate--dev" to="/categories/">
          <img class="field-gate__icon" :src="devIcon" alt="" loading="lazy">
          <div>
            <p class="field-gate__eyebrow">
              DEV LOG
            </p>
            <h3>开发记录</h3>
            <p>记录技术探索、开发心得与工具实践，让想法落地，让知识沉淀。</p>
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
            <p>收集照片、阅读、音乐与旅途中的片段，把微小瞬间妥帖保存。</p>
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
            Recent finds
          </p>
          <h2 id="field-finds-title" class="field-section__title">
            Epiphany
          </h2>
          <p class="field-section__summary">
            一些灵感
          </p>
        </div>
        <RouterLink class="field-section__more" to="/archives/">
          查看全部 <span aria-hidden="true">→</span>
        </RouterLink>
      </div>

      <div class="field-finds-grid">
        <RouterLink
          v-for="post in recentPosts"
          :key="post.path"
          class="field-find-card"
          :data-kind="entryKind(post)"
          :to="post.path || ''"
        >
          <span class="field-chip" :data-kind="entryKind(post)">
            {{ entryLabel(post) }}
          </span>
          <h3>{{ post.title }}</h3>
          <p class="field-find-card__summary">
            {{ postSummary(post) }}
          </p>
          <StarterDate :date="post.date" />
        </RouterLink>

        <div
          v-for="item in recentPosts.length ? [] : fallbackFinds"
          :key="item.title"
          class="field-find-card field-find-card--photo"
        >
          <img :src="item.image" alt="" loading="lazy">
          <span class="field-chip" data-kind="life">{{ item.label }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.summary }}</p>
        </div>
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
            我的冒险日志
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
