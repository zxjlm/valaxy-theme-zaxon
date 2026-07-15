<script setup lang="ts">
import { usePostList } from 'valaxy'
import { computed } from 'vue'
import { useFieldEntries } from '../composables'

const posts = usePostList()
const { isLife } = useFieldEntries()

const lifePosts = computed(() => posts.value.filter(post => !post.draft && isLife(post)))
</script>

<template>
  <Layout>
    <div class="field-catalog">
      <div class="field-catalog__header">
        <p class="field-kicker">
          Life Log
        </p>
        <h1 class="field-catalog__title">
          生活记录
        </h1>
        <p class="field-catalog__count">
          共计 {{ lifePosts.length }} 篇
        </p>
        <div class="field-notes__intro">
          <RouterView />
        </div>
      </div>

      <p v-if="!lifePosts.length" class="field-notes__empty">
        这里还没有生活记录，先去四处走走吧。
      </p>

      <StarterPostList v-else :posts="lifePosts" />
    </div>
  </Layout>
</template>
