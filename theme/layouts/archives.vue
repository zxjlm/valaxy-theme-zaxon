<script setup lang="ts">
import { usePostList } from 'valaxy'
import { computed } from 'vue'

const posts = usePostList()

const postsByYear = computed(() => {
  const map = new Map<number, typeof posts.value>()
  posts.value.forEach((post) => {
    if (!post.date)
      return
    const year = new Date(post.date).getFullYear()
    if (!map.has(year))
      map.set(year, [])
    map.get(year)!.push(post)
  })
  return [...map.entries()].sort((a, b) => b[0] - a[0])
})

function formatDate(date: string | number | Date) {
  const d = new Date(date)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${m}-${day}`
}
</script>

<template>
  <Layout>
    <div class="field-catalog">
      <div class="field-catalog__header">
        <p class="field-kicker">
          Field Archive
        </p>
        <h1 class="field-catalog__title">
          归档
        </h1>
        <p class="field-catalog__count">
          共计 {{ posts.length }} 篇文章
        </p>
      </div>

      <div class="field-timeline">
        <div
          v-for="[year, yearPosts] in postsByYear"
          :key="year"
          class="field-timeline__year-group"
        >
          <h2 class="field-timeline__year">
            {{ year }} <span>— {{ yearPosts.length }} 篇</span>
          </h2>
          <ul class="field-timeline__posts">
            <li v-for="post in yearPosts" :key="post.path" class="field-timeline__post">
              <time class="field-timeline__date">{{ formatDate(post.date!) }}</time>
              <div class="field-timeline__title">
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
