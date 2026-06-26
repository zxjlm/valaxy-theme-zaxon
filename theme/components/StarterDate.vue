<script lang="ts" setup>
import { formatDate } from 'valaxy'
import { computed } from 'vue'

const props = defineProps<{
  date?: Date | number | string
}>()

const datetime = computed(() => formatDate(props.date || ''))
</script>

<template>
  <dl class="field-date">
    <dt class="sr-only">
      Published on
    </dt>
    <dd>
      <time :datetime="datetime">{{ datetime }}</time>
    </dd>
  </dl>
</template>
