import type { StyleSpecification } from 'maplibre-gl'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMapResourceLoader } from './travel-map-resources'
import { mapResourceUrl, nativeCameraCenter, nativeTravelStyle, TRAVEL_MAP_SIZES } from './travel-native'

afterEach(() => vi.unstubAllGlobals())

describe('native map camera', () => {
  it('places each stop at the same padded focus as the browser map', () => {
    const camera = { lat: 34.995172, lng: 135.759739, zoom: 14 }
    const mercatorY = (lat: number) => {
      const sin = Math.sin(lat * Math.PI / 180)
      return 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)
    }
    for (const view of Object.values(TRAVEL_MAP_SIZES)) {
      const [lng, lat] = nativeCameraCenter(camera, view)
      const world = 512 * 2 ** camera.zoom
      const x = view.width / 2 + (camera.lng - lng) / 360 * world
      const y = view.height / 2 + (mercatorY(camera.lat) - mercatorY(lat)) * world
      expect(x).toBeCloseTo((view.width - view.padding.right) / 2, 6)
      expect(y).toBeCloseTo((view.height + view.padding.top - view.padding.bottom) / 2, 6)
    }
  })
})

describe('native map styles', () => {
  const style: StyleSpecification = {
    version: 8,
    glyphs: './fonts/{fontstack}/{range}.pbf',
    sources: { basemap: { type: 'vector', tiles: ['./tiles/{z}/{x}/{y}.pbf'] } },
    layers: [
      { 'id': 'places', 'type': 'symbol', 'source': 'basemap', 'source-layer': 'place' },
      { 'id': 'roads', 'type': 'symbol', 'source': 'basemap', 'source-layer': 'transportation_name' },
    ],
  }

  it('resolves relative resources without encoding template placeholders', () => {
    expect(mapResourceUrl('../fonts/{fontstack}/{range}.pbf', 'https://maps.example.com/styles/light.json'))
      .toBe('https://maps.example.com/fonts/{fontstack}/{range}.pbf')
    const output = nativeTravelStyle(style, 'https://maps.example.com/light.json', [{ lat: 35, lng: 135 }], false)
    expect(output.glyphs).toBe('https://maps.example.com/fonts/{fontstack}/{range}.pbf')
    expect(output.layers.find(layer => layer.id === 'roads')?.layout?.visibility).toBe('none')
    expect(output.layers.find(layer => layer.id === 'places')?.layout?.visibility).toBeUndefined()
    expect(style.layers[1].layout).toBeUndefined()
  })

  it('keeps single-stop GeoJSON valid and adds the route for multiple stops', () => {
    const points = [{ lat: 35, lng: 135 }, { lat: 36, lng: 136 }]
    const single = nativeTravelStyle(style, 'https://maps.example.com/style', points.slice(0, 1), false)
    const multiple = nativeTravelStyle(style, 'https://maps.example.com/style', points, true)
    const data = (value: StyleSpecification) => (value.sources['zaxon-route'] as any).data.features
    expect(data(single)).toHaveLength(1)
    expect(data(multiple)[0].geometry).toEqual({ type: 'LineString', coordinates: [[135, 35], [136, 36]] })
    expect(data(multiple).slice(1).map((point: any) => point.properties.index)).toEqual([0, 1])
    const active = multiple.layers.find(layer => layer.id === 'route-active')
    expect(active && 'filter' in active && active.filter).toEqual(['==', ['get', 'index'], -1])
  })
})

describe('native resource loader', () => {
  it('limits upstream concurrency and drains the queue', async () => {
    const finish: Array<(response: Response) => void> = []
    const request = vi.fn(() => new Promise<Response>(resolve => finish.push(resolve)))
    vi.stubGlobal('fetch', request)
    const load = createMapResourceLoader()
    const pending = Array.from({ length: 10 }, (_, index) => load(`https://maps.example.com/${index}`))
    expect(request).toHaveBeenCalledTimes(6)
    finish.slice(0, 6).forEach(resolve => resolve(new Response('tile')))
    await Promise.all(pending.slice(0, 6))
    expect(request).toHaveBeenCalledTimes(10)
    finish.slice(6).forEach(resolve => resolve(new Response('tile')))
    expect((await Promise.all(pending)).every(buffer => buffer.toString() === 'tile')).toBe(true)
  })

  it('deduplicates concurrent requests across scenes', async () => {
    const request = vi.fn(async () => new Response('tile bytes'))
    vi.stubGlobal('fetch', request)
    const load = createMapResourceLoader()
    const [first, second] = await Promise.all([load('https://maps.example.com/tile'), load('https://maps.example.com/tile')])
    expect(first.toString()).toBe('tile bytes')
    expect(second).toBe(first)
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('does not cache failed requests', async () => {
    const request = vi.fn().mockResolvedValueOnce(new Response('error', { status: 503 })).mockResolvedValueOnce(new Response('tile'))
    vi.stubGlobal('fetch', request)
    const load = createMapResourceLoader()
    await expect(load('https://maps.example.com/tile')).rejects.toThrow('503')
    expect((await load('https://maps.example.com/tile')).toString()).toBe('tile')
    expect(request).toHaveBeenCalledTimes(2)
  })
})
