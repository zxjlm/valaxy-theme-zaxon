<script setup lang="ts">
import { useTags } from 'valaxy'

const tags = useTags()
</script>

<template>
  <Layout>
    <div class="field-catalog">
      <div class="field-catalog__header">
        <p class="field-kicker">Field Index</p>
        <h1 class="field-catalog__title">
          标签
        </h1>
        <p class="field-catalog__count">
          共计 {{ tags.size }} 个标签
        </p>
      </div>

      <div class="field-tagcloud">
        <RouterLink
          v-for="[name] in tags"
          :key="name"
          :to="`/tags/${name}/`"
          class="field-tagcloud__item"
        >
          {{ name }}
        </RouterLink>
      </div>
    </div>
  </Layout>
</template>
