import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { markdownSourcePathForUrl } from './index'

describe('markdownSourcePathForUrl', () => {
  it('maps public post markdown URLs to source files', () => {
    expect(markdownSourcePathForUrl('/posts/edge-cache-field-note.md', '/site')).toBe(join('/site', 'pages', 'posts', 'edge-cache-field-note.md'))
  })

  it('rejects non-post and traversal URLs', () => {
    expect(markdownSourcePathForUrl('/about.md', '/site')).toBeNull()
    expect(markdownSourcePathForUrl('/posts/../secret.md', '/site')).toBeNull()
  })
})
