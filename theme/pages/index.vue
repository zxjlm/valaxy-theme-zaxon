<script lang="ts" setup>
import type { Post } from 'valaxy'
import { usePostList, useSiteConfig } from 'valaxy'
import { computed } from 'vue'

const siteConfig = useSiteConfig()
const posts = usePostList()

const devIcon = new URL('../assets/field-notes/icon-dev.png', import.meta.url).href
const lifeIcon = new URL('../assets/field-notes/icon-life.png', import.meta.url).href
const notebookIcon = new URL('../assets/field-notes/icon-notebook.png', import.meta.url).href
const cameraIcon = new URL('../assets/field-notes/icon-camera.png', import.meta.url).href
const compassIcon = new URL('../assets/field-notes/icon-compass.png', import.meta.url).href
const flowerDecor = new URL('../assets/field-notes/decor-flower-a.png', import.meta.url).href
const rockDecor = new URL('../assets/field-notes/decor-rocks.png', import.meta.url).href
const thumbLake = new URL('../assets/field-notes/thumb-lake.png', import.meta.url).href
const thumbCoffee = new URL('../assets/field-notes/thumb-coffee.png', import.meta.url).href
const thumbCamp = new URL('../assets/field-notes/thumb-camp.png', import.meta.url).href

function asArray(value: unknown) {
  if (Array.isArray(value))
    return value.map(item => String(item))
  return value ? [String(value)] : []
}

function postText(post: Post) {
  return [
    post.title,
    post.excerpt,
    ...asArray((post as any).tags),
    ...asArray((post as any).categories),
  ].join(' ').toLowerCase()
}

function isLife(post: Post) {
  return /photo|life|生活|旅行|摄影|阅读|随笔|音乐/.test(postText(post))
}

const visiblePosts = computed(() => posts.value.filter(post => !post.draft))
const devPosts = computed(() => visiblePosts.value.filter(post => !isLife(post)).slice(0, 3))
const lifePosts = computed(() => visiblePosts.value.filter(post => isLife(post)).slice(0, 3))
const recentPosts = computed(() => visiblePosts.value.slice(0, 4))
const latestPosts = computed(() => visiblePosts.value.slice(0, 5))

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
</script>

<template>
  <div class="field-home">
    <section class="field-hero" aria-labelledby="field-hero-title">
      <div class="field-hero__overlay" />
      <div class="field-hero__content">
        <p class="field-kicker">
          Field notes / personal worldview
        </p>
        <h1 id="field-hero-title" class="field-hero__title">
          {{ siteConfig.title || 'Harumonia' }}
        </h1>
        <p class="field-hero__subtitle">
          {{ siteConfig.subtitle || '记录代码与生活，收集微小而确定的光。' }}
        </p>
        <p class="field-hero__copy">
          在开发与生活之间，安放思考、记录与热爱。
        </p>
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
            进入两条记录路径
          </h2>
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
            最近收集的一些发现与灵感
          </h2>
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
          :to="post.path || ''"
        >
          <span class="field-chip" :data-kind="isLife(post) ? 'life' : 'dev'">
            {{ isLife(post) ? 'LIFE' : 'ARTICLE' }}
          </span>
          <h3>{{ post.title }}</h3>
          <div v-if="post.excerpt" class="field-find-card__summary" v-html="post.excerpt" />
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
            最新文章
          </h2>
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
