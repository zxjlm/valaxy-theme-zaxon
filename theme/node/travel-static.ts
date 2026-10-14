import type { TravelMotionPlan } from '../composables/travel-motion'
import type { TravelConfig } from '../types'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import { travelStopsPlugin } from './travel-markdown'

export const travelMapDefaults = {
  style: 'https://tiles.openfreemap.org/styles/positron',
  darkStyle: 'https://tiles.openfreemap.org/styles/fiord',
  attribution: 'OpenFreeMap © OpenMapTiles · Data © OpenStreetMap contributors',
  zoom: 14,
}

export interface TravelPoint {
  lat: number
  lng: number
}

export interface StaticTravelMap {
  version: 2
  renderer: 'maplibre-native'
  key: string
  points: TravelPoint[]
  attribution: string
  /** Overview first, followed by one image per stop. Paths are relative to public/. */
  scenes: Record<'desktop' | 'mobile', Record<'light' | 'dark', string[]>>
  motion: Record<'desktop' | 'mobile', TravelMotionPlan>
}

export function travelPoints(source: string, frontmatter?: Readonly<Record<string, unknown>>): TravelPoint[] {
  const { data, content } = matter(source)
  const metadata = frontmatter || data
  if (metadata.layout !== 'travel')
    return []
  const md = new MarkdownIt()
  md.use(travelStopsPlugin as any)
  return md.parse(content, { frontmatter: metadata })
    .filter(token => token.attrGet('data-travel-stop') !== null)
    .map(token => ({ lat: Number(token.attrGet('data-lat')), lng: Number(token.attrGet('data-lng')) }))
}

export function travelMapKey(points: TravelPoint[], config: Partial<TravelConfig> = {}) {
  const { style, darkStyle, zoom, attribution } = { ...travelMapDefaults, ...config }
  // Bump the renderer version when dimensions, route paint, or image encoding change.
  return createHash('sha256').update(JSON.stringify({ renderer: 'native-motion-1', points, style, darkStyle, zoom, attribution })).digest('hex').slice(0, 20)
}

export function readStaticTravelMap(userRoot: string, points: TravelPoint[], config: Partial<TravelConfig> = {}): StaticTravelMap | undefined {
  if (!points.length || config.rendering === 'live')
    return
  const key = travelMapKey(points, config)
  const publicRoot = join(userRoot, 'public')
  const path = join(publicRoot, 'travel-maps', key, 'map.json')
  if (!existsSync(path))
    return
  try {
    const map: StaticTravelMap = JSON.parse(readFileSync(path, 'utf8'))
    if (map.version !== 2 || map.renderer !== 'maplibre-native' || map.key !== key || JSON.stringify(map.points) !== JSON.stringify(points))
      return
    const imageExists = (image: string) => typeof image === 'string' && /^travel-maps\/[a-f\d]+\/[a-f\d]+\.webp$/.test(image) && existsSync(join(publicRoot, image))
    for (const size of ['desktop', 'mobile'] as const) {
      for (const mode of ['light', 'dark'] as const) {
        const images = map.scenes[size][mode]
        if (images.length !== points.length + 1 || images.some(image => !imageExists(image)))
          return
      }
      const plan = map.motion[size]
      if (plan.segments.length !== points.length + 1 || plan.overscan !== 0.24 || ![plan.viewport.width, plan.viewport.height, ...Object.values(plan.viewport.padding)].every(Number.isFinite) || plan.viewport.width <= 0 || plan.viewport.height <= 0)
        return
      for (const segment of plan.segments) {
        if (segment.length < 2 || segment[0].t !== 0 || segment.at(-1)!.t !== 1)
          return
        for (const [index, frame] of segment.entries()) {
          if (!Number.isFinite(frame.t) || (index > 0 && frame.t <= segment[index - 1].t) || ![frame.camera.lng, frame.camera.lat, frame.camera.zoom].every(Number.isFinite) || !imageExists(frame.images.light) || !imageExists(frame.images.dark))
            return
        }
      }
    }
    return map
  }
  catch {
    return undefined
  }
}
