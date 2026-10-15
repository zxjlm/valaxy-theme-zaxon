/* eslint-disable no-console */
import type { Map as NativeMap } from '@maplibre/maplibre-gl-native'
import type { StyleSpecification } from 'maplibre-gl'
import type { EventEmitter } from 'node:events'
import type { ThemeConfig } from '../types'
import type { StaticTravelMap } from './travel-static'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { loadConfigFromFile } from 'valaxy'
import { travelMotionPlan } from '../composables/travel-motion'
import { copyTravelMap, prepareCachedTravelMap, verifiedTravelMap } from './travel-map-cache'
import { createMapResourceLoader } from './travel-map-resources'
import { mapResourceUrl, nativeCameraCenter, nativeTravelStyle, TRAVEL_MAP_SIZES } from './travel-native'
import { travelMapDefaults, travelMapKey, travelPoints } from './travel-static'

const require = createRequire(import.meta.url)

async function markdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(entries.map(entry => entry.isDirectory()
    ? markdownFiles(join(dir, entry.name))
    : Promise.resolve(entry.name.endsWith('.md') ? [join(dir, entry.name)] : [])))
  return nested.flat().sort()
}

export async function generateTravelMaps() {
  const { values } = parseArgs({
    options: {
      'root': { type: 'string', default: '.' },
      'file': { type: 'string' },
      'force': { type: 'boolean', default: false },
      'check': { type: 'boolean', default: false },
      'cache-dir': { type: 'string' },
      'help': { type: 'boolean', default: false },
    },
  })
  if (values.help) {
    console.log('zaxon-travel-maps [--root <Valaxy site>] [--file <Markdown path relative to root>] [--force] [--check] [--cache-dir <directory>]')
    return
  }
  const root = resolve(values.root!)
  const publicRoot = join(root, 'public')
  const cacheRoot = resolve(values['cache-dir'] || join(root, '.cache', 'zaxon'))
  if (resolve(publicRoot) === cacheRoot || cacheRoot.startsWith(`${resolve(publicRoot)}${sep}`))
    throw new Error('--cache-dir must be outside the site public directory')
  if (values.check && values.force)
    throw new Error('--check and --force cannot be used together')
  const { config: site } = await loadConfigFromFile<{ themeConfig?: ThemeConfig }>('valaxy', { cwd: root })
  const config = { ...travelMapDefaults, ...site?.themeConfig?.travel }
  if (config.rendering === 'live') {
    console.log('[zaxon] Live travel maps enabled; no static resources required.')
    return
  }
  if (!Number.isFinite(config.zoom) || config.zoom < 0 || config.zoom > 20)
    throw new Error('travel.zoom must be between 0 and 20')
  const files = values.file ? [resolve(root, values.file)] : await markdownFiles(join(root, 'pages'))
  const resource = createMapResourceLoader()
  let generated = 0
  for (const file of files) {
    const points = travelPoints(await readFile(file, 'utf8'))
    if (!points.length)
      continue
    if (points.some(point => Math.abs(point.lat) > 85.051129))
      throw new Error(`${file}: static maps require latitudes within Web Mercator bounds (±85.051129)`)
    if (values.check) {
      if (!await verifiedTravelMap(publicRoot, points, config))
        throw new Error(`Missing, outdated, or corrupt travel map: ${file}. Run zaxon-travel-maps before building.`)
      console.log(`[zaxon] Verified: ${file}`)
      continue
    }
    const cached = !values.force && await prepareCachedTravelMap(publicRoot, cacheRoot, points, config)
    if (cached) {
      console.log(`[zaxon] ${cached === 'restored' ? 'Restored' : 'Cached and verified'}: ${file}`)
      continue
    }
    // Native libraries are optional publishing tools, loaded only for a cache miss.
    const native = require('@maplibre/maplibre-gl-native') as typeof import('@maplibre/maplibre-gl-native') & Pick<EventEmitter, 'on' | 'removeListener'>
    const { default: sharp } = await import('sharp')
    const key = travelMapKey(points, config)
    const out = join(root, 'public', 'travel-maps', key)
    await mkdir(out, { recursive: true })
    const manifest: StaticTravelMap = {
      version: 2,
      renderer: 'maplibre-native',
      key,
      points,
      attribution: config.attribution,
      scenes: { desktop: { light: [], dark: [] }, mobile: { light: [], dark: [] } },
      motion: {
        desktop: travelMotionPlan(points, TRAVEL_MAP_SIZES.desktop, config.zoom),
        mobile: travelMotionPlan(points, TRAVEL_MAP_SIZES.mobile, config.zoom),
      },
    }
    for (const mode of ['light', 'dark'] as const) {
      const configuredUrl = mode === 'dark' ? config.darkStyle : config.style
      const styleUrl = /^https?:|^file:/.test(configuredUrl)
        ? configuredUrl
        : pathToFileURL(join(root, 'public', configuredUrl.replace(/^\//, ''))).href
      const style = nativeTravelStyle(JSON.parse((await resource(styleUrl)).toString()) as StyleSpecification, styleUrl, points, mode === 'dark')
      const errors: Error[] = []
      const onMessage = (message: { severity?: string, text?: string }) => {
        if (message.severity === 'ERROR')
          errors.push(new Error(message.text || 'Native map rendering failed'))
      }
      const map: NativeMap = new native.Map({
        ratio: 1,
        request(request, callback) {
          resource(request.url).then((data) => {
            if (request.kind === 2) {
              const source = JSON.parse(data.toString())
              if (source.tiles)
                source.tiles = source.tiles.map((url: string) => mapResourceUrl(url, request.url))
              data = Buffer.from(JSON.stringify(source))
            }
            callback(undefined, { data })
          }).catch((error: Error) => {
            errors.push(error)
            callback(error)
          })
        },
      })
      native.on('message', onMessage)
      try {
        map.load(style)
        for (const size of ['desktop', 'mobile'] as const) {
          console.log(`[zaxon] Rendering ${size}/${mode} with MapLibre Native: ${file}`)
          const plan = manifest.motion[size]
          const viewport = plan.viewport
          const width = viewport.width + Math.round(viewport.width * plan.overscan) * 2
          const height = viewport.height + Math.round(viewport.height * plan.overscan) * 2
          const rendered = new Map<string, string>()
          for (const [segmentIndex, segment] of plan.segments.entries()) {
            for (const frame of segment) {
              const { camera } = frame
              const cameraKey = JSON.stringify(camera)
              let path = rendered.get(cameraKey)
              if (!path) {
                const pixels = await new Promise<Uint8Array>((resolve, reject) => {
                  map.render({ width, height, zoom: camera.zoom, center: nativeCameraCenter(camera, viewport) }, (error, buffer) => error ? reject(error) : resolve(buffer))
                })
                if (errors.length)
                  throw errors[0]
                const bytes = await sharp(pixels, { raw: { width, height, channels: 4 } }).webp({ quality: 70 }).toBuffer()
                const name = `${createHash('sha256').update(bytes).digest('hex').slice(0, 20)}.webp`
                // A failed write cannot truncate a previously published immutable image.
                await writeFile(join(out, `${name}.tmp`), bytes)
                await rename(join(out, `${name}.tmp`), join(out, name))
                path = `travel-maps/${key}/${name}`
                rendered.set(cameraKey, path)
              }
              frame.images[mode] = path
              if (segmentIndex === 0 && frame.t === 0)
                manifest.scenes[size][mode][0] = path
              if (segmentIndex < points.length && frame.t === 1)
                manifest.scenes[size][mode][segmentIndex + 1] = path
            }
            console.log(`[zaxon] ${size}/${mode} leg ${segmentIndex + 1}/${plan.segments.length}: ${segment.length} camera samples`)
          }
        }
      }
      finally {
        map.release()
        native.removeListener('message', onMessage)
      }
    }
    // Publish only after every scene succeeded; ordinary builds read this manifest offline.
    await writeFile(join(out, 'map.json.tmp'), `${JSON.stringify(manifest, null, 2)}\n`)
    await rename(join(out, 'map.json.tmp'), join(out, 'map.json'))
    const verified = await verifiedTravelMap(publicRoot, points, config)
    if (!verified)
      throw new Error(`Generated map failed verification: ${file}`)
    await copyTravelMap(verified, publicRoot, cacheRoot)
    generated += 1
    console.log(`[zaxon] Saved route endpoints and motion samples to ${out}`)
  }
  console.log(`[zaxon] Generated ${generated} route(s). Include public/travel-maps in your site deployment.`)
}
