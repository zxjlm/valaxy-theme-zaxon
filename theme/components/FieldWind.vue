<script lang="ts" setup>
const flowerA = new URL('../assets/field-notes/decor-flower-a.png', import.meta.url).href
const flowerB = new URL('../assets/field-notes/decor-flower-b.png', import.meta.url).href
const lantern = new URL('../assets/field-notes/decor-lantern.png', import.meta.url).href
const stars = new URL('../assets/field-notes/decor-stars.png', import.meta.url).href

const windLines = [
  { top: '18%', delay: '-2s', duration: '18s', width: '118px' },
  { top: '31%', delay: '-9s', duration: '24s', width: '172px' },
  { top: '47%', delay: '-14s', duration: '21s', width: '136px' },
  { top: '66%', delay: '-6s', duration: '28s', width: '196px' },
]

const driftingBits = [
  { image: flowerA, top: '22%', left: '8%', delay: '-4s', duration: '26s', size: '22px' },
  { image: flowerB, top: '54%', left: '86%', delay: '-12s', duration: '31s', size: '18px' },
  { image: stars, top: '14%', left: '73%', delay: '-18s', duration: '36s', size: '26px' },
]
</script>

<template>
  <div class="field-wind" aria-hidden="true">
    <span
      v-for="line in windLines"
      :key="line.top"
      class="field-wind__line"
      :style="{
        '--wind-top': line.top,
        '--wind-delay': line.delay,
        '--wind-duration': line.duration,
        '--wind-width': line.width,
      }"
    />

    <span
      v-for="bit in driftingBits"
      :key="`${bit.top}-${bit.left}`"
      class="field-wind__bit"
      :style="{
        '--bit-image': `url(${bit.image})`,
        '--bit-top': bit.top,
        '--bit-left': bit.left,
        '--bit-delay': bit.delay,
        '--bit-duration': bit.duration,
        '--bit-size': bit.size,
      }"
    />

    <span
      class="field-wind__lantern"
      :style="{ '--lantern-image': `url(${lantern})` }"
    />
  </div>
</template>
