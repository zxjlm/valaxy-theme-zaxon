export type HeroTheme = 'light' | 'dark'
export type HeroViewport = 'desktop' | 'mobile'

export interface HeroVariant {
  theme: HeroTheme
  viewport: HeroViewport
}

export interface ConnectionInfo {
  saveData?: boolean
  effectiveType?: string
}

export function heroVariant(isDark: boolean, isMobile: boolean): HeroVariant {
  return {
    theme: isDark ? 'dark' : 'light',
    viewport: isMobile ? 'mobile' : 'desktop',
  }
}

export function shouldLoadHeroQuality(connection?: ConnectionInfo): boolean {
  return !connection?.saveData
    && connection?.effectiveType !== 'slow-2g'
    && connection?.effectiveType !== '2g'
}

export function isCurrentHeroRequest(current: number, completed: number): boolean {
  return current === completed
}
