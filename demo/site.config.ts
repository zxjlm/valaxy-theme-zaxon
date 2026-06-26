import { defineSiteConfig } from 'valaxy'

export default defineSiteConfig({
  lang: 'zh-CN',
  title: 'Zaxon',
  subtitle: '代码、日常与旅途中的观察记录',
  url: 'https://blog.harumonia.moe/',
  author: {
    avatar: '/pwa-192x192.png',
    name: 'Harumonia',
  },
  description: '记录代码与生活，收集微小而确定的光。',
  social: [
    {
      name: 'RSS',
      link: '/atom.xml',
      icon: 'i-ri-rss-line',
      color: 'orange',
    },
    {
      name: 'GitHub',
      link: 'https://github.com/harumonia',
      icon: 'i-ri-github-line',
      color: '#6e5494',
    },
    {
      name: 'E-Mail',
      link: 'mailto:me@harumonia.moe',
      icon: 'i-ri-mail-line',
      color: '#8E71C1',
    },
  ],

  comment: {
    enable: false,
  },
})
