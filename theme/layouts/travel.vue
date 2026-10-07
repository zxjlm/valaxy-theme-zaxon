<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { TravelStop } from '../composables'
import { nextTick, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { collectTravelStops } from '../composables'

const route = useRoute()
const article = ref<ComponentPublicInstance>()
const stops = shallowRef<TravelStop[]>([])
const active = ref(-1)

async function refreshStops() {
  await nextTick()
  const root = article.value?.$el as HTMLElement | undefined
  stops.value = root ? collectTravelStops(root) : []
  active.value = -1
}

onMounted(refreshStops)
watch(() => route.fullPath, refreshStops)

watch(active, (index, previous) => {
  stops.value[previous]?.el.classList.remove('travel-stop--active')
  stops.value[index]?.el.classList.add('travel-stop--active')
})
</script>

<template>
  <Layout>
    <StarterArticle ref="article">
      <RouterView />
      <template #aside>
        <TravelItinerary :stops="stops" :active="active" />
      </template>
    </StarterArticle>
    <TravelMapBackdrop v-if="stops.length" v-model:active="active" :stops="stops" />
  </Layout>
</template>
