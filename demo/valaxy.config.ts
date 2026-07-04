import type { ThemeConfig } from 'valaxy-theme-zaxon'
import { defineConfig } from 'valaxy'

/**
 * User Config
 * do not use export const config to avoid defu conflict
 */
export default defineConfig<ThemeConfig>({
  theme: 'zaxon',

  themeConfig: {
    // colors: {
    //   primary: 'red',
    // },

    nav: [
      {
        text: '首页',
        link: '/',
      },
      {
        text: '开发',
        link: '/categories/',
      },
      {
        text: '生活',
        link: '/notes/',
      },
      {
        text: '相册',
        link: '/albums/',
      },
      {
        text: '归档',
        link: '/archives/',
      },
      {
        text: '关于',
        link: '/about/',
      },
    ],

    albums: {
      enable: true,
      indexPath: '/albums/index.json',
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
