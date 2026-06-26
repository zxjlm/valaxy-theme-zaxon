<script setup lang="ts">
import type { Post } from 'valaxy'
import { usePostList } from 'valaxy'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  type?: string
  posts?: Post[]
  curPage?: number
}>(), {
  curPage: 1,
})

const routes = usePostList({ type: props.type || '' })
const posts = computed(() => props.posts || routes.value)
</script>

<template>
  <ul class="field-post-list">
    <template v-for="post in posts" :key="post.path">
      <Transition name="fade">
        <li v-if="post" class="field-post-list__item">
          <StarterArticleCard :post="post" />
        </li>
      </Transition>
    </template>
  </ul>
</template>
