<script setup lang="ts">
import { useFrontmatter, usePostList } from 'valaxy'
import { computed } from 'vue'

import { useRoute } from 'vue-router'
import notebookIcon from '../assets/field-notes/icon-notebook.png'
import travelerWriting from '../assets/field-notes/traveler-writing.png'
import { markdownPathForRoute } from '../composables'

const frontmatter = useFrontmatter()

const route = useRoute()
const posts = usePostList()
const aiDisclosureTags = new Set(['ai-assisted', 'ai-use'])

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

const markdownUrl = computed(() => markdownPathForRoute(route.path))
const nextPost = computed(() => posts.value[findCurrentIndex() - 1])
const prevPost = computed(() => posts.value[findCurrentIndex() + 1])
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
        </div>
      </aside>

      <div class="field-post__content">
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

        <div class="field-post__markdown-action">
          <a class="field-markdown-link" :href="markdownUrl">
            view as markdown
          </a>
        </div>
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
