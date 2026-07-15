import { describe, expect, it } from 'vitest'

import { heroPreviewUrl, heroVariant, isCurrentHeroRequest, shouldLoadHeroQuality } from './hero-background'

describe('hero background policy', () => {
  it.each([
    [false, false, { theme: 'light', viewport: 'desktop' }],
    [false, true, { theme: 'light', viewport: 'mobile' }],
    [true, false, { theme: 'dark', viewport: 'desktop' }],
    [true, true, { theme: 'dark', viewport: 'mobile' }],
  ])('selects the matching variant', (dark, mobile, expected) => {
    expect(heroVariant(dark, mobile)).toEqual(expected)
  })

  it.each([
    [undefined, true],
    [{ saveData: true, effectiveType: '4g' }, false],
    [{ saveData: false, effectiveType: 'slow-2g' }, false],
    [{ saveData: false, effectiveType: '2g' }, false],
    [{ saveData: false, effectiveType: '4g' }, true],
  ])('applies the connection policy', (connection, expected) => {
    expect(shouldLoadHeroQuality(connection)).toBe(expected)
  })

  it('rejects a stale completion', () => {
    expect(isCurrentHeroRequest(3, 2)).toBe(false)
    expect(isCurrentHeroRequest(3, 3)).toBe(true)
  })

  it('uses no preview when its URL is omitted or blank', () => {
    expect(heroPreviewUrl()).toBeUndefined()
    expect(heroPreviewUrl('   ')).toBeUndefined()
    expect(heroPreviewUrl('https://example.com/preview.webp')).toBe('https://example.com/preview.webp')
  })
})
