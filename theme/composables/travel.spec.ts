import { describe, expect, it } from 'vitest'

import { cameraTiles, easeWithin, flyInterpolator, overviewCamera, readingPosition, stopLabel } from './travel'

const kansaiAirport = { lng: 135.242278, lat: 34.436444, zoom: 14 }
const gojo = { lng: 135.759739, lat: 34.995172, zoom: 14 }
const hotel = { lng: 135.769775, lat: 34.995037, zoom: 14 }

describe('flyInterpolator', () => {
  it('starts and ends exactly at the given cameras', () => {
    const fly = flyInterpolator(kansaiAirport, gojo, 1200)
    expect(fly(0)).toEqual(kansaiAirport)
    expect(fly(1)).toEqual(gojo)
  })

  it('zooms out between distant stops and passes near the midpoint', () => {
    const middle = flyInterpolator(kansaiAirport, gojo, 1200)(0.5)
    expect(middle.zoom).toBeLessThan(11)
    expect(middle.lng).toBeCloseTo((kansaiAirport.lng + gojo.lng) / 2, 1)
    expect(middle.lat).toBeCloseTo((kansaiAirport.lat + gojo.lat) / 2, 1)
  })

  it('barely zooms out between nearby stops', () => {
    const middle = flyInterpolator(gojo, hotel, 1200)(0.5)
    expect(middle.zoom).toBeGreaterThan(13)
  })

  it('moves monotonically along the route', () => {
    const fly = flyInterpolator(kansaiAirport, gojo, 1200)
    const longitudes = [0.1, 0.3, 0.5, 0.7, 0.9].map(t => fly(t).lng)
    expect([...longitudes].sort((a, b) => a - b)).toEqual(longitudes)
  })

  it('stays put when both cameras are the same', () => {
    const fly = flyInterpolator(hotel, hotel, 1200)
    expect(fly(0.5).lng).toBeCloseTo(hotel.lng, 9)
    expect(fly(0.5).lat).toBeCloseTo(hotel.lat, 9)
    expect(fly(0.5).zoom).toBeCloseTo(hotel.zoom, 9)
  })
})

describe('overviewCamera', () => {
  it('centres between the extremes and zooms to fit the box', () => {
    const camera = overviewCamera([kansaiAirport, gojo, hotel], 600, 800, 13)
    expect(camera.lng).toBeCloseTo((kansaiAirport.lng + hotel.lng) / 2, 4)
    expect(camera.lat).toBeGreaterThan(kansaiAirport.lat)
    expect(camera.lat).toBeLessThan(gojo.lat)
    expect(camera.zoom).toBeGreaterThan(8)
    expect(camera.zoom).toBeLessThan(10)
  })

  it('caps the zoom for a single point', () => {
    expect(overviewCamera([hotel], 600, 800, 13).zoom).toBe(13)
  })
})

describe('cameraTiles', () => {
  const noPadding = { top: 0, right: 0, bottom: 0, left: 0 }

  it('covers the viewport around the camera at the integer zoom', () => {
    const tiles = cameraTiles(gojo, { width: 1024, height: 512, padding: noPadding }, 0, 14)
    expect(new Set(tiles.map(tile => tile.z))).toEqual(new Set([14]))
    // A 1024×512 viewport spans 2×1 tiles, plus one partial tile on each axis.
    expect(tiles.length).toBeGreaterThanOrEqual(2)
    expect(tiles.length).toBeLessThanOrEqual(6)
    const xs = tiles.map(tile => tile.x)
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(2)
    expect(tiles).toContainEqual({ z: 14, x: 14370, y: 6489 })
  })

  it('shifts coverage with the padded focus', () => {
    const centred = cameraTiles(gojo, { width: 2048, height: 512, padding: noPadding }, 0, 14)
    const focusLeft = cameraTiles(gojo, { width: 2048, height: 512, padding: { ...noPadding, right: 1536 } }, 0, 14)
    expect(Math.max(...focusLeft.map(tile => tile.x))).toBeGreaterThan(Math.max(...centred.map(tile => tile.x)))
  })

  it('clamps to the source zoom range', () => {
    expect(cameraTiles({ ...gojo, zoom: 16.4 }, { width: 512, height: 512, padding: noPadding }, 0, 14)[0].z).toBe(14)
  })
})

describe('readingPosition', () => {
  const keyframes = [100, 500, 900, 1500]

  it('clamps before the first and after the last keyframe', () => {
    expect(readingPosition(keyframes, 0)).toEqual({ segment: 0, progress: 0 })
    expect(readingPosition(keyframes, 2000)).toEqual({ segment: 2, progress: 1 })
  })

  it('reports the passed keyframe and the progress towards the next', () => {
    expect(readingPosition(keyframes, 300)).toEqual({ segment: 0, progress: 0.5 })
    expect(readingPosition(keyframes, 900)).toEqual({ segment: 2, progress: 0 })
    expect(readingPosition(keyframes, 1200)).toEqual({ segment: 2, progress: 0.5 })
  })

  it('treats coincident keyframes as already reached', () => {
    expect(readingPosition([0, 400, 400, 800], 400)).toEqual({ segment: 2, progress: 0 })
  })
})

describe('stopLabel', () => {
  it('keeps the spot after the area and drops the trailing note', () => {
    expect(stopLabel('京都市下京区大坂町　京都市营地铁乌丸线 五条駅（K10）')).toBe('京都市营地铁乌丸线 五条駅')
    expect(stopLabel('大阪府大阪市北区—淀川区　上淀川橋梁（大阪駅与新大阪駅之间，Haruka 走的梅田货物线）')).toBe('上淀川橋梁')
  })

  it('falls back to the whole line', () => {
    expect(stopLabel('五条駅')).toBe('五条駅')
    expect(stopLabel('（K10）')).toBe('（K10）')
  })
})

describe('easeWithin', () => {
  it('rests outside the window and eases inside it', () => {
    expect(easeWithin(0.8, 0, 0.5)).toBe(1)
    expect(easeWithin(0.2, 0.4, 1)).toBe(0)
    expect(easeWithin(0.25, 0, 0.5)).toBeCloseTo(0.5)
  })
})
