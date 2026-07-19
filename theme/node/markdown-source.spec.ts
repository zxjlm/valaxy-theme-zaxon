import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { appendArticleNotice, articleUrlForPath, markdownSourcePathForUrl } from './index'

describe('markdownSourcePathForUrl', () => {
  it('maps public post markdown URLs to source files', () => {
    expect(markdownSourcePathForUrl('/posts/edge-cache-field-note.md', '/site')).toBe(join('/site', 'pages', 'posts', 'edge-cache-field-note.md'))
  })

  it('rejects non-post and traversal URLs', () => {
    expect(markdownSourcePathForUrl('/about.md', '/site')).toBeNull()
    expect(markdownSourcePathForUrl('/posts/../secret.md', '/site')).toBeNull()
  })
})

describe('article notice', () => {
  it('uses the configured blog URL and the article path', () => {
    const articleUrl = articleUrlForPath('/posts/edge-cache-field-note', 'https://blog.example.com/')
    expect(articleUrl).toBe('https://blog.example.com/posts/edge-cache-field-note')
    expect(appendArticleNotice('# Article', articleUrl)).toContain(
      '[https://blog.example.com/posts/edge-cache-field-note](https://blog.example.com/posts/edge-cache-field-note)',
    )
  })
})
