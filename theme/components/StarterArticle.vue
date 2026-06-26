<script setup lang="ts">
import { useFrontmatter, usePostList } from 'valaxy'
import { computed } from 'vue'

import { useRoute } from 'vue-router'

const frontmatter = useFrontmatter()

const route = useRoute()
const posts = usePostList()

function findCurrentIndex() {
  return posts.value.findIndex(p => p.path === route.path)
}

const nextPost = computed(() => posts.value[findCurrentIndex() - 1])
const prevPost = computed(() => posts.value[findCurrentIndex() + 1])
const travelerWriting = new URL('../assets/field-notes/traveler-writing.png', import.meta.url).href
const notebookIcon = new URL('../assets/field-notes/icon-notebook.png', import.meta.url).href
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
