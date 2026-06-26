<script lang="ts" setup>
import FieldWind from './FieldWind.vue'
</script>

<template>
  <div class="field-shell antialiased">
    <a class="field-skip-link" href="#main-content">跳到正文</a>
    <FieldWind />

    <header class="field-nav">
      <StarterNav />
    </header>

    <main id="main-content" class="field-main field-main-frame">
      <slot>
        <RouterView v-slot="{ Component }">
          <component :is="Component">
            <template #main-header>
              <slot name="main-header" />
            </template>

            <template #main-header-after>
              <slot name="main-header-after" />
            </template>
            <template #main>
              <slot name="main" />
            </template>
            <template #main-content>
              <slot name="main-content" />
            </template>
            <template #main-content-after>
              <slot name="main-content-after" />
            </template>
            <template #main-nav-before>
              <slot name="main-nav-before" />
            </template>
            <template #main-nav-after>
              <slot name="main-nav-after" />
            </template>
            <template #aside-custom>
              <slot name="aside-custom" />
            </template>
            <template #footer>
              <slot name="footer" />
            </template>
          </component>
        </RouterView>
      </slot>
    </main>

    <StarterHelper />

    <StarterFooter>
      <slot name="footer" />
    </StarterFooter>
  </div>
</template>
