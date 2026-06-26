<script lang="ts" setup>
import { useSiteConfig, useValaxyConfig } from 'valaxy'
import pkg from 'valaxy/package.json'
import { capitalize, computed } from 'vue'

import { useI18n } from 'vue-i18n'
import { useThemeConfig } from '../composables'

const { t } = useI18n()

const config = useValaxyConfig()
const siteConfig = useSiteConfig()
const themeConfig = useThemeConfig()

const year = new Date().getFullYear()

const isThisYear = computed(() => {
  return year === themeConfig.value.footer.since
})

const poweredHtml = computed(() => t('footer.powered', [`<a href="${pkg.repository}" target="_blank" rel="noopener">Valaxy</a> v${pkg.version}`]))
const footerIcon = computed(() => themeConfig.value.footer.icon!)
</script>

<template>
  <footer class="field-footer">
    <div v-if="themeConfig.footer.beian?.enable && themeConfig.footer.beian.icp" class="field-footer__beian">
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">
        {{ themeConfig.footer.beian.icp }}
      </a>
    </div>

    <div class="field-footer__copyright">
      <span>
        &copy;
        <template v-if="!isThisYear">
          {{ themeConfig.footer.since }} -
        </template>
        {{ year }}
      </span>

      <a class="field-footer__icon" :href="footerIcon.url" target="_blank" :title="footerIcon.title">
        <div :class="footerIcon.name" />
      </a>

      <span>{{ siteConfig.author.name }}</span>
    </div>

    <div v-if="themeConfig.footer.powered" class="field-footer__powered">
      <span v-html="poweredHtml" /> | <span>{{ t('footer.theme') }} - <a :href="themeConfig.pkg.homepage" :title="`valaxy-theme-${config.theme}`" target="_blank">{{ capitalize(config.theme) }}</a> v{{ themeConfig.pkg.version }}</span>
    </div>

    <slot />
  </footer>
</template>
