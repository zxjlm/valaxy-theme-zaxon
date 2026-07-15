<script setup lang="ts">
import { usePostList } from 'valaxy'
import { computed } from 'vue'
import { entryKind, entryLabel, useFieldEntries } from '../composables'

const posts = usePostList()
const { isLife } = useFieldEntries()

const techPosts = computed(() => posts.value.filter(post => !post.draft && !isLife(post)))

const postsByYear = computed(() => {
  const map = new Map<number, typeof techPosts.value>()

  techPosts.value.forEach((post) => {
    if (!post.date)
      return

    const year = new Date(post.date).getFullYear()
    if (!map.has(year))
      map.set(year, [])
    map.get(year)!.push(post)
  })

  return [...map.entries()].sort((first, second) => second[0] - first[0])
})

function formatDate(date: string | number | Date) {
  const value = new Date(date)
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${month}-${day}`
}
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

      <div v-else class="field-timeline">
        <div v-for="[year, yearPosts] in postsByYear" :key="year" class="field-timeline__year-group">
          <h2 class="field-timeline__year">
            {{ year }} <span>· {{ yearPosts.length }} 篇</span>
          </h2>
          <ul class="field-timeline__posts">
            <li v-for="post in yearPosts" :key="post.path" class="field-timeline__post">
              <time class="field-timeline__date">{{ formatDate(post.date!) }}</time>
              <div class="field-timeline__title">
                <span class="field-chip" :data-kind="entryKind(post)">
                  {{ entryLabel(post) }}
                </span>
                <RouterLink :to="post.path || ''">
                  {{ post.title }}
                </RouterLink>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Layout>
</template>
