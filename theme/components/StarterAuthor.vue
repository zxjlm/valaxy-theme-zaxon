<script setup lang="ts">
import type { Post } from 'valaxy'

defineProps<{
  frontmatter: Post
}>()
</script>

<template>
  <dl class="field-author">
    <dt class="sr-only">
      Authors
    </dt>
    <dd>
      <ul>
        <li>
          <img
            v-if="frontmatter.gravatar"
            :src="`https://gravatar.com/avatar/${frontmatter.gravatar}`"
            alt="author image"
            class="field-author__avatar"
          >
          <dl>
            <dt class="sr-only">
              Name
            </dt>
            <dd class="field-author__name">
              {{ frontmatter.author }}
            </dd>
            <dt v-if="frontmatter.twitter" class="sr-only">
              Twitter
            </dt>
            <dd v-if="frontmatter.twitter">
              <a
                :href="`https://twitter.com/${frontmatter.twitter}`"
                target="_blank"
                rel="noopnener noreferrer"
                class="link"
              >{{ frontmatter.twitter }}</a>
            </dd>
          </dl>
        </li>
      </ul>
    </dd>
  </dl>
</template>
