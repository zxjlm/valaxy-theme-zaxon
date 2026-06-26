<script lang="ts" setup>
import flowerA from '../assets/field-notes/decor-flower-a.png'
import flowerB from '../assets/field-notes/decor-flower-b.png'
import lantern from '../assets/field-notes/decor-lantern.png'
import stars from '../assets/field-notes/decor-stars.png'

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

const fireflies = [
  { top: '12%', left:  '9%', blinkDelay:  '0s',   blinkDuration: '3.4s', wanderDelay:   '0s', wanderDuration: '20s' },
  { top: '28%', left: '63%', blinkDelay: '-1.4s',  blinkDuration: '2.8s', wanderDelay:  '-7s', wanderDuration: '17s' },
  { top: '44%', left: '22%', blinkDelay: '-2.7s',  blinkDuration: '4.2s', wanderDelay: '-14s', wanderDuration: '25s' },
  { top: '58%', left: '78%', blinkDelay: '-0.9s',  blinkDuration: '3.0s', wanderDelay:  '-4s', wanderDuration: '19s' },
  { top: '74%', left: '44%', blinkDelay: '-3.6s',  blinkDuration: '4.8s', wanderDelay: '-17s', wanderDuration: '28s' },
  { top: '19%', left: '87%', blinkDelay: '-2.1s',  blinkDuration: '3.7s', wanderDelay: '-10s', wanderDuration: '22s' },
  { top: '63%', left: '13%', blinkDelay: '-4.4s',  blinkDuration: '2.6s', wanderDelay:  '-3s', wanderDuration: '16s' },
  { top: '37%', left: '51%', blinkDelay: '-5.2s',  blinkDuration: '3.9s', wanderDelay: '-20s', wanderDuration: '27s' },
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

    <span
      v-for="fly in fireflies"
      :key="`fly-${fly.top}-${fly.left}`"
      class="field-wind__firefly"
      :style="{
        '--fly-top': fly.top,
        '--fly-left': fly.left,
        '--fly-blink-delay': fly.blinkDelay,
        '--fly-blink-duration': fly.blinkDuration,
        '--fly-wander-delay': fly.wanderDelay,
        '--fly-wander-duration': fly.wanderDuration,
      }"
    />
  </div>
</template>
