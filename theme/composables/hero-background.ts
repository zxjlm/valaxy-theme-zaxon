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

/**
 * Empty preview URLs are treated as absent so users can opt out with either an
 * omitted field or an empty string in their Valaxy config.
 */
export function heroPreviewUrl(url?: string): string | undefined {
  const normalized = url?.trim()
  return normalized || undefined
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
