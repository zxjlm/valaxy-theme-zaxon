import { describe, expect, it } from 'vitest'

import { markdownPathForRoute } from './markdown'

describe('markdownPathForRoute', () => {
  it('converts article routes to sibling markdown paths', () => {
    expect(markdownPathForRoute('/2026/6/23/the-coming-loop/')).toBe('/2026/6/23/the-coming-loop.md')
    expect(markdownPathForRoute('/posts/hello-valaxy')).toBe('/posts/hello-valaxy.md')
  })
})
