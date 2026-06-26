<script lang="ts" setup>
const travelerStanding = new URL('../assets/field-notes/traveler-standing.png', import.meta.url).href
const travelerWriting = new URL('../assets/field-notes/traveler-writing.png', import.meta.url).href
const notebook = new URL('../assets/field-notes/icon-notebook.png', import.meta.url).href
</script>

<template>
  <div class="field-companions" aria-hidden="true">
    <div class="field-companion field-companion--traveler">
      <img class="field-companion__pose field-companion__pose--standing" :src="travelerStanding" alt="">
      <img class="field-companion__pose field-companion__pose--writing" :src="travelerWriting" alt="">
    </div>

    <span
      class="field-companion field-companion--notebook"
      :style="{ '--companion-image': `url(${notebook})` }"
    />
  </div>
</template>
