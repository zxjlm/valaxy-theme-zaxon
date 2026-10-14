import type { StaticTravelMap } from './travel-static'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { travelMotionPlan } from '../composables/travel-motion'
import { TRAVEL_MAP_SIZES } from './travel-native'
import { readStaticTravelMap, travelMapKey, travelPoints } from './travel-static'

const roots: string[] = []
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })))

describe('travelPoints', () => {
  const body = '五条駅  \n34.995172, 135.759739\n\n```txt\n34.1, 135.1\n```\n\n> 引用\n> 34.2, 135.2'

  it('uses the same paragraph coordinates and ordering as the rendered Markdown', () => {
    // Fenced code is excluded; quoted paragraphs work just like the browser renderer.
    const expected = [{ lat: 34.995172, lng: 135.759739 }, { lat: 34.2, lng: 135.2 }]
    expect(travelPoints(`---\nlayout: travel\n---\n${body}`)).toEqual(expected)
    expect(travelPoints(body, { layout: 'travel' })).toEqual(expected)
    expect(travelPoints(body, { layout: 'post' })).toEqual([])
  })
})

describe('static map artifacts', () => {
  const points = [{ lat: 34.995172, lng: 135.759739 }]

  it('invalidates artifacts when geometry, order, style, zoom, or attribution changes', () => {
    const key = travelMapKey(points)
    expect(travelMapKey(points, { opacity: 0.8, staticBaseUrl: 'https://cdn.example.com/' })).toBe(key)
    expect(travelMapKey([...points, ...points])).not.toBe(key)
    expect(travelMapKey([{ ...points[0], lat: 35 }])).not.toBe(key)
    for (const config of [{ zoom: 12 }, { style: '/style.json' }, { darkStyle: '/dark.json' }, { attribution: 'Custom' }])
      expect(travelMapKey(points, config)).not.toBe(key)
  })

  it('rejects incomplete, corrupt, or unsafe manifests instead of embedding them', () => {
    const root = mkdtempSync(join(tmpdir(), 'zaxon-maps-'))
    roots.push(root)
    const key = travelMapKey(points)
    const dir = join(root, 'public', 'travel-maps', key)
    mkdirSync(dir, { recursive: true })
    const image = `travel-maps/${key}/abcdef.webp`
    const images = [image, image]
    const manifest: StaticTravelMap = {
      version: 2,
      renderer: 'maplibre-native',
      key,
      points,
      attribution: 'OpenFreeMap',
      scenes: { desktop: { light: images, dark: images }, mobile: { light: images, dark: images } },
      motion: {
        desktop: travelMotionPlan(points, TRAVEL_MAP_SIZES.desktop, 14),
        mobile: travelMotionPlan(points, TRAVEL_MAP_SIZES.mobile, 14),
      },
    }
    for (const plan of Object.values(manifest.motion)) {
      for (const segment of plan.segments) {
        for (const frame of segment)
          frame.images = { light: image, dark: image }
      }
    }
    const path = join(dir, 'map.json')
    writeFileSync(path, JSON.stringify(manifest))
    expect(readStaticTravelMap(root, points)).toBeUndefined()
    writeFileSync(join(dir, 'abcdef.webp'), 'image fixture')
    expect(readStaticTravelMap(root, points)).toEqual(manifest)
    const intermediate = manifest.motion.desktop.segments[0][1]
    intermediate.images.dark = `travel-maps/${key}/123456.webp`
    writeFileSync(path, JSON.stringify(manifest))
    expect(readStaticTravelMap(root, points)).toBeUndefined()
    intermediate.images.dark = image
    writeFileSync(path, JSON.stringify(manifest))
    expect(readStaticTravelMap(root, points, { rendering: 'live' })).toBeUndefined()
    expect(readStaticTravelMap(root, points, { zoom: 12 })).toBeUndefined()
    manifest.scenes.mobile.dark = ['../../secret', image]
    writeFileSync(path, JSON.stringify(manifest))
    expect(readStaticTravelMap(root, points)).toBeUndefined()
    writeFileSync(path, '{')
    expect(readStaticTravelMap(root, points)).toBeUndefined()
  })
})
