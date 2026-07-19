import type { ThemeConfig } from 'valaxy-theme-zaxon'
import { defineConfig } from 'valaxy'

/**
 * User Config
 * do not use export const config to avoid defu conflict
 */
export default defineConfig<ThemeConfig>({
  theme: 'zaxon',

  themeConfig: {
    snowlin: {
      frequency: 'normal',
    },

    // colors: {
    //   primary: 'red',
    // },

    content: {
      lifeCategories: ['Life Log'],
      devCategories: ['Dev Log'],
    },

    hero: {
      desktopLight: 'https://raw.githubusercontent.com/zxjlm/my-static-files/main/img/hero-field-desktop-light.png',
      desktopDark: 'https://raw.githubusercontent.com/zxjlm/my-static-files/main/img/hero-field-desktop-dark.png',
      mobileLight: 'https://raw.githubusercontent.com/zxjlm/my-static-files/main/img/hero-field-mobile-light.png',
      mobileDark: 'https://raw.githubusercontent.com/zxjlm/my-static-files/main/img/hero-field-mobile-dark.png',
      desktopLightPreview: 'https://raw.githubusercontent.com/zxjlm/my-static-files/main/img/hero-field-desktop-light-low.webp',
      desktopDarkPreview: 'https://raw.githubusercontent.com/zxjlm/my-static-files/main/img/hero-field-desktop-dark-low.webp',
      mobileLightPreview: 'https://raw.githubusercontent.com/zxjlm/my-static-files/main/img/hero-field-mobile-light-low.webp',
      mobileDarkPreview: 'https://raw.githubusercontent.com/zxjlm/my-static-files/main/img/hero-field-mobile-dark-low.webp',
    },

    nav: [
      {
        text: '首页',
        link: '/',
      },
      {
        text: '技术',
        link: '/tech/',
      },
      {
        text: '生活',
        link: '/notes/',
      },
      {
        text: '相册',
        link: '/albums',
      },
      {
        text: '关于',
        link: '/about/',
      },
    ],

    albums: {
      enable: true,
      indexPath: '/argus-albums/index.json',
      title: '相册',
      description: '从 Argus 发布的照片记录。',
      featured: {
        enable: false,
        limit: 6,
      },
    },

    footer: {
      since: 2016,
    },
  },
})
