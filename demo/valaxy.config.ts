import type { ThemeConfig } from 'valaxy-theme-starter'
import { defineConfig } from 'valaxy'

/**
 * User Config
 * do not use export const config to avoid defu conflict
 */
export default defineConfig<ThemeConfig>({
  theme: 'starter',

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
        text: '归档',
        link: '/archives/',
      },
      {
        text: '关于',
        link: '/about/',
      },
    ],

    footer: {
      since: 2016,
    },
  },
})
