import { describe, expect, it, vi } from 'vitest'
import { createTravelFrameCache } from './travel-frame-cache'

const image = () => ({ naturalWidth: 5, naturalHeight: 10 })
const settle = () => new Promise(resolve => setTimeout(resolve, 0))

describe('travel frame cache', () => {
  it('shares loaded and inflight images', async () => {
    const load = vi.fn(async () => image())
    const ready = vi.fn()
    const cache = createTravelFrameCache({ load, ready })
    cache.request('a')
    cache.prefetch(['a', 'a'])
    await settle()
    cache.request('a')
    expect(load).toHaveBeenCalledTimes(1)
    expect(cache.get('a')).toEqual(image())
    expect(ready).toHaveBeenCalledTimes(1)
    cache.dispose()
  })

  it('prioritizes the viewport and drops obsolete queued prefetches', async () => {
    const resolvers = new Map<string, (value: ReturnType<typeof image>) => void>()
    const load = vi.fn((url: string) => new Promise<ReturnType<typeof image>>(resolve => resolvers.set(url, resolve)))
    const cache = createTravelFrameCache({ load, ready: () => {}, concurrency: 1 })
    cache.prefetch(['old-running', 'old-queued'])
    cache.request('current')
    cache.prefetch(['next'])
    resolvers.get('old-running')!(image())
    await settle()
    expect(load.mock.calls.map(call => call[0])).toEqual(['old-running', 'current'])
    resolvers.get('current')!(image())
    await settle()
    expect(load.mock.calls.map(call => call[0])).toEqual(['old-running', 'current', 'next'])
    cache.dispose()
  })

  it('bounds decoded pixels while retaining the visible target', async () => {
    const cache = createTravelFrameCache({ load: async () => image(), ready: () => {}, maxPixels: 100 })
    cache.request('visible')
    await settle()
    cache.prefetch(['b', 'c'])
    await settle()
    expect(cache.get('visible')).toBeDefined()
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('c')).toBeDefined()
    cache.dispose()
  })

  it('does not retry missing images every scroll frame', async () => {
    const load = vi.fn(async () => {
      throw new Error('404')
    })
    const error = vi.fn()
    const cache = createTravelFrameCache({ load, ready: () => {}, error })
    cache.request('missing')
    await settle()
    for (let index = 0; index < 10; index += 1)
      cache.request('missing')
    await settle()
    expect(load).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenCalledTimes(1)
    cache.dispose()
  })

  it('ignores completions after unmount', async () => {
    let finish: (value: ReturnType<typeof image>) => void = () => {}
    const ready = vi.fn()
    const cache = createTravelFrameCache({ load: () => new Promise<ReturnType<typeof image>>(resolve => finish = resolve), ready })
    cache.request('a')
    cache.dispose()
    finish(image())
    await settle()
    expect(ready).not.toHaveBeenCalled()
    expect(cache.get('a')).toBeUndefined()
  })
})
