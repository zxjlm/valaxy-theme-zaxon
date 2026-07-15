<script setup lang="ts">
import { usePostList } from 'valaxy'
import { computed } from 'vue'
import { useFieldEntries } from '../composables'

const posts = usePostList()
const { isLife } = useFieldEntries()

const techPosts = computed(() => posts.value.filter(post => !post.draft && !isLife(post)))
</script>

<template>
  <Layout>
    <div class="field-catalog">
      <div class="field-catalog__header">
        <p class="field-kicker">
          Tech Log
        </p>
        <h1 class="field-catalog__title">
          技术
        </h1>
        <p class="field-catalog__count">
          共计 {{ techPosts.length }} 篇
        </p>
        <div class="field-notes__intro">
          <RouterView />
        </div>
      </div>

      <p v-if="!techPosts.length" class="field-notes__empty">
        这里还没有技术记录，下一次实践会从这里开始。
      </p>

      <StarterPostList v-else :posts="techPosts" />
    </div>
  </Layout>
</template>
