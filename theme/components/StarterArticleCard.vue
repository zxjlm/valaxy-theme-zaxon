<script lang="ts" setup>
import type { Post } from 'valaxy'
import { computed } from 'vue'

import devIcon from '../assets/field-notes/icon-dev.png'
import noteIcon from '../assets/field-notes/icon-notebook.png'
import photoThumb from '../assets/field-notes/thumb-lake.png'

const props = defineProps<{
  post: Post
}>()

function asArray(value: unknown) {
  if (Array.isArray(value))
    return value.map(item => String(item))
  return value ? [String(value)] : []
}

const postText = computed(() => [
  props.post.title,
  props.post.excerpt,
  ...asArray((props.post as any).tags),
  ...asArray((props.post as any).categories),
].join(' ').toLowerCase())

const kind = computed(() => {
  const text = postText.value
  if (/photo|life|生活|旅行|摄影|阅读|随笔|音乐/.test(text))
    return 'life'
  if (/note|笔记|memo|i18n|test/.test(text))
    return 'note'
  return 'dev'
})

const kindLabel = computed(() => {
  if (kind.value === 'life')
    return 'LIFE'
  if (kind.value === 'note')
    return 'NOTE'
  return 'DEV'
})

const icon = computed(() => {
  if (kind.value === 'life')
    return photoThumb
  if (kind.value === 'note')
    return noteIcon
  return devIcon
})

const tags = computed(() => asArray((props.post as any).tags).slice(0, 3))
const articleLabel = computed(() => String(props.post.title || 'Read article'))
</script>

<template>
  <article class="field-article-card" :data-kind="kind">
    <RouterLink class="field-article-card__link" :to="post.path || ''" :aria-label="articleLabel" />

    <div class="field-article-card__icon" aria-hidden="true">
      <img :src="icon" alt="" loading="lazy">
    </div>

    <div class="field-article-card__body">
      <div class="field-article-card__meta">
        <span class="field-chip" :data-kind="kind">{{ kindLabel }}</span>
        <StarterDate :date="post.date" />
      </div>

      <h2 class="field-article-card__title">
        {{ post.title }}
      </h2>

      <div
        v-if="post.excerpt"
        class="field-article-card__excerpt"
        v-html="post.excerpt"
      />

      <div class="field-article-card__footer">
        <div class="field-article-card__tags">
          <span v-for="tag in tags" :key="tag" class="field-tag">{{ tag }}</span>
        </div>
        <span class="field-read-more">Read article <span aria-hidden="true">›</span></span>
      </div>
    </div>
  </article>
</template>
