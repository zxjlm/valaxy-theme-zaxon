<script lang="ts" setup>
import { useAppStore, useSiteConfig } from 'valaxy'
import { computed, ref } from 'vue'
import { useThemeConfig } from '../composables'

const appStore = useAppStore()

const siteConfig = useSiteConfig()
const themeConfig = useThemeConfig()
const menuOpen = ref(false)

import brandSprite from '../assets/field-notes/traveler-standing.png'

const navItems = computed(() => {
  return themeConfig.value.nav?.length
    ? themeConfig.value.nav
    : [
        { text: '首页', link: '/' },
        { text: '开发', link: '/categories/' },
        { text: '生活', link: '/notes/' },
        { text: '归档', link: '/archives/' },
        { text: '关于', link: '/about/' },
      ]
})
</script>

<template>
  <nav class="field-nav-frame" :aria-label="siteConfig.title">
    <div class="field-nav__inner">
      <RouterLink class="field-brand" to="/" :aria-label="siteConfig.title">
        <img
          class="field-brand__sprite"
          alt=""
          :src="brandSprite"
        >
        <span>{{ siteConfig.title }}</span>
      </RouterLink>

      <div class="field-nav__links">
        <template v-for="item in navItems" :key="item.link">
          <AppLink
            class="field-nav__link"
            :to="item.link"
            rel="noopener"
          >
            {{ item.text }}
          </AppLink>
        </template>
      </div>

      <div class="field-nav__actions">
        <RouterLink class="field-icon-button field-nav__archive" to="/archives/" aria-label="查看归档">
          <div i-ri-archive-line />
        </RouterLink>

        <button class="field-icon-button" type="button" aria-label="切换明暗主题" @click="appStore.toggleDarkWithTransition">
          <div v-if="!appStore.isDark" i-ri-sun-line />
          <div v-else i-ri-moon-line />
        </button>

        <button
          class="field-icon-button field-nav__menu"
          type="button"
          :aria-expanded="menuOpen"
          aria-controls="field-mobile-nav"
          aria-label="打开导航菜单"
          @click="menuOpen = !menuOpen"
        >
          <div v-if="!menuOpen" i-ri-menu-3-line />
          <div v-else i-ri-close-line />
        </button>
      </div>
    </div>

    <div id="field-mobile-nav" class="field-nav__mobile" :data-open="menuOpen ? 'true' : 'false'">
      <div class="field-nav__mobile-inner">
        <template v-for="item in navItems" :key="`mobile-${item.link}`">
          <AppLink class="field-nav__link" :to="item.link" rel="noopener" @click="menuOpen = false">
            {{ item.text }}
          </AppLink>
        </template>
      </div>
    </div>
  </nav>
</template>
