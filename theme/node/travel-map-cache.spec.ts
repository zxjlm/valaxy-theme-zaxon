import type { StaticTravelMap } from './travel-static'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { travelMotionPlan } from '../composables/travel-motion'
import { copyTravelMap, prepareCachedTravelMap, travelMapImages, verifiedTravelMap } from './travel-map-cache'
import { TRAVEL_MAP_SIZES } from './travel-native'
import { travelMapKey } from './travel-static'

const roots: string[] = []
const points = [{ lat: 34.995172, lng: 135.759739 }]
afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'zaxon-map-cache-'))
  roots.push(root)
  const publicRoot = join(root, 'public')
  const cacheRoot = join(root, '.cache', 'zaxon')
  const key = travelMapKey(points)
  const bytes = Buffer.from('immutable rendered image fixture')
  const digest = createHash('sha256').update(bytes).digest('hex').slice(0, 20)
  const image = `travel-maps/${key}/${digest}.webp`
  const images = [image, image]
  const map: StaticTravelMap = {
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
  for (const plan of Object.values(map.motion)) {
    for (const frame of plan.segments.flat())
      frame.images = { light: image, dark: image }
  }
  const manifest = join(publicRoot, 'travel-maps', key, 'map.json')
  await mkdir(join(publicRoot, 'travel-maps', key), { recursive: true })
  await writeFile(join(publicRoot, image), bytes)
  await writeFile(manifest, `${JSON.stringify(map, null, 2)}\n`)
  return { publicRoot, cacheRoot, image, bytes, manifest, map }
}

describe('travel publishing cache', () => {
  it('seeds a cache from verified local images and restores a clean checkout offline', async () => {
    const f = await fixture()
    expect(travelMapImages(f.map)).toEqual([f.image])
    expect(await prepareCachedTravelMap(f.publicRoot, f.cacheRoot, points, {})).toBe('local')
    await rm(join(f.publicRoot, f.image))
    expect(await verifiedTravelMap(f.publicRoot, points, {})).toBeUndefined()
    expect(await prepareCachedTravelMap(f.publicRoot, f.cacheRoot, points, {})).toBe('restored')
    expect(await readFile(join(f.publicRoot, f.image))).toEqual(f.bytes)
    expect(await verifiedTravelMap(f.publicRoot, points, {})).toEqual(f.map)
  })

  it('repairs a truncated local image from a valid cache', async () => {
    const f = await fixture()
    await prepareCachedTravelMap(f.publicRoot, f.cacheRoot, points, {})
    await writeFile(join(f.publicRoot, f.image), 'truncated')
    expect(await verifiedTravelMap(f.publicRoot, points, {})).toBeUndefined()
    expect(await prepareCachedTravelMap(f.publicRoot, f.cacheRoot, points, {})).toBe('restored')
    expect(await readFile(join(f.publicRoot, f.image))).toEqual(f.bytes)
  })

  it('rejects corrupt cached bytes without publishing them', async () => {
    const f = await fixture()
    await prepareCachedTravelMap(f.publicRoot, f.cacheRoot, points, {})
    await writeFile(join(f.cacheRoot, f.image), 'wrong bytes under a valid name')
    await rm(join(f.publicRoot, f.image))
    expect(await prepareCachedTravelMap(f.publicRoot, f.cacheRoot, points, {})).toBeUndefined()
    await expect(readFile(join(f.publicRoot, f.image))).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('does not restore another route or stale render settings', async () => {
    const f = await fixture()
    await prepareCachedTravelMap(f.publicRoot, f.cacheRoot, points, {})
    await rm(join(f.publicRoot, f.image))
    expect(await prepareCachedTravelMap(f.publicRoot, f.cacheRoot, [{ ...points[0], lat: 35 }], {})).toBeUndefined()
    expect(await prepareCachedTravelMap(f.publicRoot, f.cacheRoot, points, { zoom: 12 })).toBeUndefined()
    f.map.scenes.mobile.dark[0] = f.image.replace(f.map.key, 'abcdef')
    await writeFile(f.manifest, JSON.stringify(f.map))
    expect(await verifiedTravelMap(f.publicRoot, points, {})).toBeUndefined()
  })

  it('does not publish a new manifest when an image copy fails', async () => {
    const f = await fixture()
    await copyTravelMap(f.map, f.publicRoot, f.cacheRoot)
    const cachedManifest = join(f.cacheRoot, 'travel-maps', f.map.key, 'map.json')
    const original = await readFile(cachedManifest)
    await rm(join(f.publicRoot, f.image))
    await expect(copyTravelMap({ ...f.map, attribution: 'new version' }, f.publicRoot, f.cacheRoot)).rejects.toMatchObject({ code: 'ENOENT' })
    expect(await readFile(cachedManifest)).toEqual(original)
  })
})
