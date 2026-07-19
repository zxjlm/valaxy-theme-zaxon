import type { DefaultTheme } from 'valaxy'
import type { ArgusAlbumsConfig } from './albums'

export namespace ZaxonTheme {
  export type Config = ThemeConfig
  export type Sidebar = any
}

/**
 * Theme Config
 */
export interface ThemeConfig extends DefaultTheme.Config {
  colors: {
    /**
     * primary color
     * @default '#0078E7'
     */
    primary: string
  }

  /**
   * 首页 Hero 图片。高清图为必填；对应的 Preview 图可选，未设置时直接显示高清图。
   */
  hero: HeroConfig

  /**
   * footer
   */
  footer: Partial<{
    /**
     * 建站于
     */
    since: number

    /**
     * Icon between year and copyright info.
     */
    icon: {
      /**
       * icon name, i-xxx
       */
      name: string
      animated: boolean
      color: string
      url: string
      title: string
    }

    /**
     * Powered by valaxy & valaxy-theme-${name}, default is yun
     */
    powered: boolean

    /**
     * Chinese Users | 中国用户
     * 备案 ICP
     * 国内用户需要在网站页脚展示备案 ICP 号
     * https://beian.miit.gov.cn/
     */
    beian: {
      enable: boolean
      /**
       * 苏ICP备xxxxxxxx号
       */
      icp: string
    }
  }>

  /**
   * navbar
   */
  nav: NavItem[]

  /**
   * 内容分组：用于首页 DEV / LIFE 拆分以及 /notes 生活流的归类。
   *
   * 优先按文章的顶级分类判断；命中 lifeCategories 视为「生活」，
   * 命中 devCategories 视为「开发」。两者都未命中时，回退到标题 /
   * 摘要 / 标签的关键词匹配。
   */
  content?: Partial<{
    /**
     * 归入「生活」的分类名（如 起居杂录、桂苑酌记、见闻录）
     */
    lifeCategories: string[]
    /**
     * 归入「开发」的分类名（如 源流清泉）
     */
    devCategories: string[]
  }>

  /**
   * 日间飞行雪绒彩蛋。
   * `frequency` 只影响随机的环境演出，功能指路仍在页面稳定后按需执行。
   */
  snowlin?: Partial<{
    /** 是否启用雪绒彩蛋与功能指路。 @default true */
    enable: boolean
    /** 随机环境演出的频率：`low` 每 60 秒、`normal` 每 30 秒、`high` 每 10 秒；`debug` 每 3 秒，仅用于本地验证。 @default 'normal' */
    frequency: 'low' | 'normal' | 'high' | 'debug'
  }>

  /**
   * Argus static album publishing integration.
   */
  albums?: Partial<ArgusAlbumsConfig>
}

export interface HeroConfig {
  /** Desktop light-mode full-resolution image URL. */
  desktopLight: string
  /** Desktop dark-mode full-resolution image URL. */
  desktopDark: string
  /** Mobile light-mode full-resolution image URL. */
  mobileLight: string
  /** Mobile dark-mode full-resolution image URL. */
  mobileDark: string

  /** Optional desktop light-mode preview image URL, normally WebP. */
  desktopLightPreview?: string
  /** Optional desktop dark-mode preview image URL, normally WebP. */
  desktopDarkPreview?: string
  /** Optional mobile light-mode preview image URL, normally WebP. */
  mobileLightPreview?: string
  /** Optional mobile dark-mode preview image URL, normally WebP. */
  mobileDarkPreview?: string
}

export interface NavItem {
  text: string
  link: string
  icon?: string
}

export type ThemeUserConfig = Partial<ThemeConfig>
