<script lang="ts" setup>
import { useSiteConfig } from 'valaxy'

const siteConfig = useSiteConfig()
</script>

<template>
  <div class="field-page-header">
    <h1
      class="field-page-header__title"
    >
      {{ siteConfig.title }}
    </h1>
    <p class="field-page-header__summary">
      {{ siteConfig.subtitle }}
    </p>
  </div>
</template>
