<script setup lang="ts">
import type { TravelStop } from '../composables'
import { TRAVEL_READING_LINE } from '../composables'

defineProps<{
  stops: TravelStop[]
  active: number
}>()

function visit(stop: TravelStop) {
  // Just past the reading line, the camera has settled on this stop.
  const top = stop.el.getBoundingClientRect().top + window.scrollY - window.innerHeight * TRAVEL_READING_LINE + 2
  window.scrollTo({ top, behavior: 'smooth' })
}
</script>

<template>
  <nav v-if="stops.length" class="travel-itinerary" aria-label="行程">
    <p class="travel-itinerary__title">
      行程 · {{ stops.length }} 处
    </p>
    <ol class="travel-itinerary__list">
      <li v-for="(stop, index) in stops" :key="index">
        <button
          type="button"
          class="travel-itinerary__stop"
          :class="{ 'travel-itinerary__stop--active': index === active }"
          :aria-current="index === active ? 'location' : undefined"
          :title="stop.place"
          @click="visit(stop)"
        >
          <span class="travel-itinerary__index">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="travel-itinerary__label">{{ stop.label }}</span>
        </button>
      </li>
    </ol>
  </nav>
</template>
