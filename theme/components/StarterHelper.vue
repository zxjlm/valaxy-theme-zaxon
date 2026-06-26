<script lang="ts" setup>
import { isClient, useWindowScroll } from '@vueuse/core'
import { computed } from 'vue'

const { y } = useWindowScroll()
const showBackToTop = computed(() => y.value > 50)

function backToTop() {
  if (!isClient)
    return
  window.scrollTo({ top: 0 })
}
</script>

<template>
  <div class="field-helper">
    <Transition>
      <button
        v-if="showBackToTop"
        class="field-icon-button"
        type="button"
        aria-label="返回顶部"
        @click="backToTop"
      >
        <div i-ri-arrow-up-line />
      </button>
    </Transition>
  </div>
</template>
