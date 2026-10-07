import type { TileResponse } from './travel-tiles'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createTileScheduler } from './travel-tiles'

function controllableFetch() {
  const calls: string[] = []
  const pending = new Map<string, (response: TileResponse) => void>()
  const fetchTile = vi.fn((url: string) => {
    calls.push(url)
    return new Promise<TileResponse>((resolve) => {
      pending.set(url, resolve)
    })
  })
  const respond = (url: string, bytes = 4) => pending.get(url)!({ data: new ArrayBuffer(bytes) })
  return { fetchTile, calls, respond }
}

describe('createTileScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('never hits the network for requests cancelled during the start delay', async () => {
    const { fetchTile } = controllableFetch()
    const scheduler = createTileScheduler({ fetchTile, startDelay: 150 })
    const controller = new AbortController()
    const result = scheduler.request('a', controller.signal)

    await vi.advanceTimersByTimeAsync(100)
    controller.abort()
    await expect(result).rejects.toMatchObject({ name: 'AbortError' })
    await vi.advanceTimersByTimeAsync(200)

    expect(fetchTile).not.toHaveBeenCalled()
  })

  it('serves the newest request first and respects the concurrency limit', async () => {
    const { fetchTile, calls, respond } = controllableFetch()
    const scheduler = createTileScheduler({ fetchTile, startDelay: 0, concurrency: 1 })
    scheduler.request('first')
    await vi.advanceTimersByTimeAsync(0)
    scheduler.request('older')
    scheduler.request('newer')

    respond('first')
    await vi.advanceTimersByTimeAsync(0)
    expect(calls).toEqual(['first', 'newer'])
  })

  it('shares one network request between duplicate requests and caches the result', async () => {
    const { fetchTile, respond } = controllableFetch()
    const scheduler = createTileScheduler({ fetchTile, startDelay: 0 })
    const first = scheduler.request('a')
    const second = scheduler.request('a')
    await vi.advanceTimersByTimeAsync(0)
    respond('a', 8)

    const [one, two] = await Promise.all([first, second])
    expect(fetchTile).toHaveBeenCalledTimes(1)
    expect(one.data.byteLength).toBe(8)
    expect(one.data).not.toBe(two.data)

    const third = await scheduler.request('a')
    expect(third.data.byteLength).toBe(8)
    expect(fetchTile).toHaveBeenCalledTimes(1)
  })

  it('keeps downloading a started request after it is cancelled', async () => {
    const { fetchTile, respond } = controllableFetch()
    const scheduler = createTileScheduler({ fetchTile, startDelay: 0 })
    const controller = new AbortController()
    const result = scheduler.request('a', controller.signal)
    await vi.advanceTimersByTimeAsync(0)

    controller.abort()
    await expect(result).rejects.toMatchObject({ name: 'AbortError' })
    respond('a')
    await vi.advanceTimersByTimeAsync(0)

    expect(scheduler.has('a')).toBe(true)
  })

  it('runs prefetches only with idle capacity', async () => {
    const { calls, fetchTile, respond } = controllableFetch()
    const scheduler = createTileScheduler({ fetchTile, startDelay: 0, concurrency: 2, prefetchConcurrency: 1 })
    scheduler.prefetch(['p1', 'p2'])
    scheduler.request('live')
    await vi.advanceTimersByTimeAsync(0)
    expect(calls).toEqual(['p1', 'live'])

    respond('p1')
    await vi.advanceTimersByTimeAsync(0)
    expect(calls).toEqual(['p1', 'live', 'p2'])
  })

  it('evicts the least recently used tiles beyond the byte budget', async () => {
    const { fetchTile, respond } = controllableFetch()
    const scheduler = createTileScheduler({ fetchTile, startDelay: 0, maxBytes: 10 })
    for (const url of ['a', 'b', 'c']) {
      const result = scheduler.request(url)
      await vi.advanceTimersByTimeAsync(0)
      respond(url, 4)
      await result
    }

    expect(scheduler.has('a')).toBe(false)
    expect(scheduler.has('b')).toBe(true)
    expect(scheduler.has('c')).toBe(true)
  })
})
