<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { TravelStop } from '../composables'
import type { StaticTravelMap } from '../node/travel-static'
import { useFrontmatter } from 'valaxy'
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { collectTravelStops, useThemeConfig } from '../composables'

const route = useRoute()
const frontmatter = useFrontmatter()
const config = useThemeConfig()
const staticMap = computed(() => config.value.travel?.rendering === 'live' ? undefined : frontmatter.value.travelMap as StaticTravelMap | undefined)
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
    <template v-if="stops.length">
      <TravelStaticBackdrop v-if="staticMap" :key="`${route.path}:${staticMap.key}`" v-model:active="active" :stops="stops" :map="staticMap" />
      <TravelMapBackdrop v-else-if="config.travel?.rendering !== 'static'" :key="route.path" v-model:active="active" :stops="stops" />
    </template>
  </Layout>
</template>
