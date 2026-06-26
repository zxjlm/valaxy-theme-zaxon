<script lang="ts" setup>
import travelerStanding from '../assets/field-notes/traveler-standing.png'
import travelerWriting from '../assets/field-notes/traveler-writing.png'
import notebook from '../assets/field-notes/icon-notebook.png'
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
