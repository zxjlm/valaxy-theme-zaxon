<script lang="ts" setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const lostTraveler = new URL('../assets/field-notes/traveler-camera.png', import.meta.url).href
const signpost = new URL('../assets/field-notes/signpost-two.png', import.meta.url).href
</script>

<template>
  <Layout>
    <section class="field-lost" aria-labelledby="field-lost-title">
      <img class="field-lost__sign" :src="signpost" alt="" loading="lazy">
      <img class="field-lost__traveler" :src="lostTraveler" alt="" loading="lazy">
      <div>
        <p class="field-kicker">
          Lost in the field
        </p>
        <h1 id="field-lost-title">
          这里已经超出地图范围。
        </h1>
        <RouterView />
        <div class="field-lost__actions">
          <RouterLink class="field-button field-button--dev" to="/">
            返回首页
          </RouterLink>
          <RouterLink class="field-button" to="/archives/">
            查看归档
          </RouterLink>
          <button class="field-button" type="button" @click="router.back()">
            后退一步
          </button>
        </div>
      </div>
    </section>
  </Layout>
</template>
