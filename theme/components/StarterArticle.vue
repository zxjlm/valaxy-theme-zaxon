<script setup lang="ts">
import { useFrontmatter, usePostList } from 'valaxy'
import { computed, nextTick, onMounted, ref, watch, watchEffect } from 'vue'

import { useRoute } from 'vue-router'
import notebookIcon from '../assets/field-notes/icon-notebook.png'
import travelerWriting from '../assets/field-notes/traveler-writing.png'
import { markdownPathForRoute } from '../composables'

const frontmatter = useFrontmatter()

const route = useRoute()
const posts = usePostList()
const aiDisclosureTags = new Set(['ai-assisted', 'ai-use'])
const content = ref<HTMLElement>()
const tocItems = ref<Array<{ id: string, level: number, text: string }>>([])

const aiDisclosureItems = [
  '1. AI 强化类文章。笔者在实践某类功能时，发现 AI 踩了很多坑，所以提供一篇精准的文章，类似于 skill，旨在帮助其他 AI 在实现相同目标时有更好的效果。',
  '2. 翻译类文章。笔者平时研究工作较多，在发现外网有比较好的文章时，会翻译为中文进行分享。过去是人工翻译，现在当然也是 AI 为主、人工校对。当然，这类文章占比会很少，因为本身在互联网大环境下属于重复类型的内容。',
]

function findCurrentIndex() {
  return posts.value.findIndex(p => p.path === route.path)
}

function normalizeTags(tags: unknown) {
  if (Array.isArray(tags))
    return tags.map(tag => String(tag).toLowerCase())

  if (typeof tags === 'string')
    return [tags.toLowerCase()]

  return []
}

const hasAiDisclosure = computed(() => {
  return normalizeTags(frontmatter.value.tags).some(tag => aiDisclosureTags.has(tag))
})

watchEffect(() => {
  if (frontmatter.value.katex)
    void import('katex/dist/katex.css')
})

const markdownUrl = computed(() => markdownPathForRoute(route.path))
const nextPost = computed(() => posts.value[findCurrentIndex() - 1])
const prevPost = computed(() => posts.value[findCurrentIndex() + 1])

function headingId(heading: HTMLElement, usedIds: Set<string>) {
  if (heading.id) {
    usedIds.add(heading.id)
    return heading.id
  }

  const base = heading.textContent
    ?.trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'section'
  let id = base
  let suffix = 2
  while (usedIds.has(id) || document.getElementById(id)) {
    id = `${base}-${suffix}`
    suffix += 1
  }
  heading.id = id
  usedIds.add(id)
  return id
}

async function refreshToc() {
  await nextTick()
  const headings = Array.from(content.value?.querySelectorAll<HTMLElement>('h2, h3, h4') || [])
  const usedIds = new Set<string>()
  tocItems.value = headings
    .map((heading) => {
      const text = heading.textContent?.trim() || ''
      if (!text)
        return undefined
      return {
        id: headingId(heading, usedIds),
        level: Number(heading.tagName.slice(1)),
        text,
      }
    })
    .filter((item): item is { id: string, level: number, text: string } => Boolean(item))
}

onMounted(refreshToc)
watch(() => route.fullPath, refreshToc)
</script>

<template>
  <article class="field-post">
    <header class="field-post__header">
      <div class="field-post__sprite" aria-hidden="true">
        <img :src="travelerWriting" alt="">
      </div>
      <p class="field-kicker">
        Field entry
      </p>
      <h1 class="field-post__title">
        {{ frontmatter.title }}
      </h1>
      <div class="field-post__meta">
        <StarterDate :date="frontmatter.date" />
        <span v-if="frontmatter.categories">{{ frontmatter.categories }}</span>
      </div>
    </header>

    <div class="field-post__layout">
      <aside class="field-post__aside">
        <StarterAuthor v-if="frontmatter.author" :frontmatter="frontmatter" />
        <div class="field-post__toc-card">
          <img :src="notebookIcon" alt="" loading="lazy">
          <span>阅读札记</span>
          <p>正文保持安静，代码、引用和图片使用统一的手帐边界。</p>
          <nav v-if="tocItems.length" class="field-post__toc" aria-label="文章目录" data-field-guide="table-of-contents">
            <a
              v-for="item in tocItems"
              :key="item.id"
              class="field-post__toc-link"
              :class="`field-post__toc-link--level-${item.level}`"
              :href="`#${item.id}`"
            >
              {{ item.text }}
            </a>
          </nav>
          <a class="field-markdown-link" :href="markdownUrl" data-field-guide="view-as-markdown">
            <span>view as markdown</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </aside>

      <div ref="content" class="field-post__content">
        <blockquote v-if="hasAiDisclosure" class="field-ai-disclosure">
          <p>
            这个文章的内容主要由 AI 生成，人工进行校对认证。这类文章一般有两个产出的原因：
          </p>
          <ol>
            <li v-for="item in aiDisclosureItems" :key="item">
              {{ item }}
            </li>
          </ol>
        </blockquote>

        <slot />
      </div>

      <footer class="field-post__pager">
        <div v-if="nextPost && nextPost.path" class="field-post__pager-item">
          <h2>
            上一篇
          </h2>
          <div>
            <RouterLink :to="nextPost.path">
              {{ nextPost.title }}
            </RouterLink>
          </div>
        </div>
        <div v-if="prevPost && prevPost.path" class="field-post__pager-item">
          <h2>
            下一篇
          </h2>
          <div>
            <RouterLink :to="prevPost.path">
              {{ prevPost.title }}
            </RouterLink>
          </div>
        </div>
        <div class="field-post__pager-item">
          <RouterLink to="/">
            ← 返回手记
          </RouterLink>
        </div>
      </footer>
    </div>
  </article>
</template>
