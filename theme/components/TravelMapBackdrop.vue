<script setup lang="ts">
import type { GeoJSONSourceSpecification, Map as MapLibreMap, VectorTileSource } from 'maplibre-gl'
import type { TravelCamera, TravelStop, TravelViewport } from '../composables'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { useAppStore } from 'valaxy'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  cameraTiles,
  easeWithin,
  flyInterpolator,
  overviewCamera,
  readingPosition,
  sharedTileScheduler,
  TRAVEL_READING_LINE,
  useThemeConfig,
} from '../composables'

const props = defineProps<{
  stops: TravelStop[]
}>()

const active = defineModel<number>('active', { default: -1 })

interface TileSource {
  tiles: string[]
  minzoom: number
  maxzoom: number
}

/** The camera arrives at a stop within this share of the section leading to it. */
const ARRIVE_BY = 0.55
/** The final pull-back to the whole route starts after this share of the closing section. */
const LEAVE_FROM = 0.35
const DESKTOP_MIN_WIDTH = 860
const OVERVIEW_MARGIN = 56
const ROUTE_SOURCE = 'zaxon-travel-route'
const TILE_PROTOCOL = 'zaxon-tile'
const VECTOR_TILE_URL = /^https?:\/\/.+\.(?:pbf|mvt)(?:\?|$)/
/** Sections ahead of the reader whose tiles are fetched while the network is idle. */
const PREFETCH_SECTIONS = 2
const PREFETCH_SAMPLES = [0.25, 0.5, 0.75, 1]
const PREFETCH_LIMIT = 96

const themeConfig = useThemeConfig()
const appStore = useAppStore()
const travel = computed(() => themeConfig.value.travel || {})
const stopZoom = computed(() => travel.value.zoom ?? 14)
const styleUrl = computed(() => appStore.isDark ? travel.value.darkStyle : travel.value.style)

const canvas = ref<HTMLElement>()
const mounted = ref(false)
const ready = ref(false)

let map: MapLibreMap | undefined
let styleLoaded = false
let disposed = false
let keyframes: number[] = []
let segments: Array<(t: number) => TravelCamera> = []
let view: TravelViewport | undefined
let tileSources: TileSource[] | undefined
let prefetchedSegment = -1
let frame = 0
let resizeObserver: ResizeObserver | undefined
let reducedMotion: MediaQueryList | undefined

/**
 * The canvas covers less than the window (see travel.scss); the camera focuses
 * on the left 45% of the window on desktop, and between the nav and 60% of the
 * window height on mobile.
 */
function measureView(): TravelViewport {
  const width = canvas.value?.clientWidth || window.innerWidth
  const height = canvas.value?.clientHeight || window.innerHeight
  const nav = document.querySelector('.field-nav')?.getBoundingClientRect().height ?? 0

  if (window.innerWidth >= DESKTOP_MIN_WIDTH) {
    const right = Math.max(0, width - Math.round(window.innerWidth * 0.45))
    return { width, height, padding: { top: nav, right, bottom: 0, left: 0 } }
  }

  const bottom = Math.max(0, height - Math.round(window.innerHeight * 0.6))
  return { width, height, padding: { top: nav, right: 0, bottom, left: 0 } }
}

function saveData() {
  return Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)
}

function readTileSources() {
  const sources: TileSource[] = []
  if (!map || !styleLoaded)
    return sources

  for (const id of Object.keys(map.getStyle().sources)) {
    const source = map.getSource(id) as VectorTileSource | undefined
    if (source?.type !== 'vector' || source.tileSize !== 512 || source.scheme === 'tms' || !source.tiles?.length)
      continue
    // Only plain {z}/{x}/{y} templates can be expanded the same way MapLibre does.
    if (source.tiles.some(template => /\{(?![xyz]\})/.test(template)))
      continue
    sources.push({ tiles: source.tiles, minzoom: source.minzoom, maxzoom: source.maxzoom })
  }
  return sources
}

function invalidateTileSources() {
  tileSources = undefined
  prefetchedSegment = -1
  schedule()
}

function prefetchAhead(segment: number) {
  tileSources ??= readTileSources()
  const sources = tileSources
  if (!view || !segments.length || !sources.length || saveData())
    return

  prefetchedSegment = segment
  const urls = new Set<string>()
  for (const fly of segments.slice(segment, segment + PREFETCH_SECTIONS + 1)) {
    for (const t of PREFETCH_SAMPLES) {
      const camera = fly(t)
      for (const source of sources) {
        for (const { z, x, y } of cameraTiles(camera, view, source.minzoom, source.maxzoom)) {
          urls.add(source.tiles[(x + y) % source.tiles.length]
            .replace(/\{z\}/g, String(z))
            .replace(/\{x\}/g, String(x))
            .replace(/\{y\}/g, String(y)))
        }
      }
    }
  }
  sharedTileScheduler().prefetch([...urls].slice(0, PREFETCH_LIMIT))
}

function documentTop(el: Element) {
  return el.getBoundingClientRect().top + window.scrollY
}

function measure() {
  if (!map || !props.stops.length)
    return

  const viewportHeight = window.innerHeight
  const content = props.stops[0].el.closest('.field-post__content')
  const offsets = props.stops.map(stop => documentTop(stop.el))
  const start = Math.min(content ? documentTop(content) : 0, offsets[0])
  const maxAnchor = document.documentElement.scrollHeight - viewportHeight + viewportHeight * TRAVEL_READING_LINE
  keyframes = [start, ...offsets, Math.max(maxAnchor, offsets.at(-1)! + 1)]

  view = measureView()
  const { padding } = view
  const focusWidth = view.width - padding.left - padding.right
  const focusHeight = view.height - padding.top - padding.bottom
  map.setPadding(padding)
  const overview = overviewCamera(props.stops, focusWidth - OVERVIEW_MARGIN * 2, focusHeight - OVERVIEW_MARGIN * 2, stopZoom.value - 1)
  const cameras = [overview, ...props.stops.map(stop => ({ lng: stop.lng, lat: stop.lat, zoom: stopZoom.value })), overview]
  const viewportSize = Math.max(focusWidth, focusHeight)
  segments = cameras.slice(1).map((to, index) => flyInterpolator(cameras[index], to, viewportSize))
  prefetchedSegment = -1

  schedule()
}

function update() {
  frame = 0
  if (!map || !segments.length)
    return

  const { segment, progress } = readingPosition(keyframes, window.scrollY + window.innerHeight * TRAVEL_READING_LINE)
  let t = segment === segments.length - 1
    ? easeWithin(progress, LEAVE_FROM, 1)
    : easeWithin(progress, 0, ARRIVE_BY)
  if (reducedMotion?.matches)
    t = Math.round(t)

  const camera = segments[segment](t)
  map.jumpTo({ center: [camera.lng, camera.lat], zoom: camera.zoom })
  // Segment k flies from stop k - 1 to stop k; the first and last legs involve the overview.
  const nearest = t >= 0.5 ? segment : segment - 1
  active.value = Math.min(Math.max(nearest, 0), props.stops.length - 1)

  if (segment !== prefetchedSegment)
    prefetchAhead(segment)
}

function schedule() {
  if (!frame)
    frame = requestAnimationFrame(update)
}

function routeData(): GeoJSONSourceSpecification['data'] {
  const coordinates = props.stops.map(stop => [stop.lng, stop.lat])
  return {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } },
      ...coordinates.map((point, index) => ({
        type: 'Feature' as const,
        properties: { index },
        geometry: { type: 'Point' as const, coordinates: point },
      })),
    ],
  }
}

function activeFilter() {
  return ['==', ['get', 'index'], active.value] as any
}

function quietBasemap() {
  for (const layer of map?.getStyle().layers ?? []) {
    if (layer.type === 'symbol' && layer['source-layer'] !== 'place')
      map!.setLayoutProperty(layer.id, 'visibility', 'none')
  }
}

function drawRoute() {
  if (!map || !styleLoaded)
    return

  for (const id of ['zaxon-travel-active', 'zaxon-travel-stops', 'zaxon-travel-line']) {
    if (map.getLayer(id))
      map.removeLayer(id)
  }
  if (map.getSource(ROUTE_SOURCE))
    map.removeSource(ROUTE_SOURCE)

  const styles = getComputedStyle(document.documentElement)
  const accent = styles.getPropertyValue('--st-accent-lantern').trim() || '#d98732'
  const ground = styles.getPropertyValue('--st-bg-canvas').trim() || '#f4f1e8'

  map.addSource(ROUTE_SOURCE, { type: 'geojson', data: routeData() })
  map.addLayer({
    id: 'zaxon-travel-line',
    type: 'line',
    source: ROUTE_SOURCE,
    filter: ['==', ['geometry-type'], 'LineString'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': accent, 'line-width': 2.5, 'line-opacity': 0.85, 'line-dasharray': [1.6, 1.4] },
  })
  map.addLayer({
    id: 'zaxon-travel-stops',
    type: 'circle',
    source: ROUTE_SOURCE,
    filter: ['==', ['geometry-type'], 'Point'],
    paint: { 'circle-radius': 4, 'circle-color': accent, 'circle-stroke-color': ground, 'circle-stroke-width': 1.5 },
  })
  map.addLayer({
    id: 'zaxon-travel-active',
    type: 'circle',
    source: ROUTE_SOURCE,
    filter: activeFilter(),
    paint: {
      'circle-radius': 11,
      'circle-color': accent,
      'circle-opacity': 0.22,
      'circle-stroke-color': accent,
      'circle-stroke-width': 2,
    },
  })
}

function observeContent() {
  resizeObserver?.disconnect()
  const content = props.stops[0]?.el.closest('.field-post__content')
  if (content)
    resizeObserver?.observe(content)
}

onMounted(async () => {
  mounted.value = true
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  await nextTick()

  try {
    const [maplibre] = await Promise.all([
      import('maplibre-gl'),
      import('maplibre-gl/dist/maplibre-gl.css'),
    ])
    if (disposed || !canvas.value || !styleUrl.value)
      return

    const tiles = sharedTileScheduler()
    const protocolPrefix = `${TILE_PROTOCOL}://`
    maplibre.setWorkerUrl(workerUrl)
    // Every scroll frame moves the camera, so MapLibre requests and cancels tiles
    // for views that only last a frame. The scheduler delays, deduplicates and
    // caches those requests; see travel-tiles.ts.
    maplibre.addProtocol(TILE_PROTOCOL, (params, controller) =>
      tiles.request(params.url.slice(protocolPrefix.length), controller.signal))
    map = new maplibre.Map({
      container: canvas.value,
      style: styleUrl.value,
      center: [props.stops[0]?.lng ?? 0, props.stops[0]?.lat ?? 0],
      zoom: stopZoom.value,
      interactive: false,
      attributionControl: false,
      pixelRatio: Math.min(window.devicePixelRatio, 1.5),
      transformRequest: (url, type) => (type as string) === 'Tile' && VECTOR_TILE_URL.test(url)
        ? { url: protocolPrefix + url }
        : undefined,
    })
    map.on('style.load', () => {
      styleLoaded = true
      quietBasemap()
      drawRoute()
      invalidateTileSources()
    })
    map.on('sourcedata', (event) => {
      if (event.sourceDataType === 'metadata')
        invalidateTileSources()
    })
    map.once('load', () => {
      ready.value = true
    })
  }
  catch (error) {
    console.warn('[zaxon] travel map unavailable', error)
    return
  }

  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', measure)
  resizeObserver = new ResizeObserver(measure)
  observeContent()
  measure()
})

onBeforeUnmount(() => {
  disposed = true
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', measure)
  cancelAnimationFrame(frame)
  resizeObserver?.disconnect()
  map?.remove()
  map = undefined
  styleLoaded = false
})

watch(() => props.stops, () => {
  observeContent()
  drawRoute()
  measure()
})

watch(active, () => {
  if (map?.getLayer('zaxon-travel-active'))
    map.setFilter('zaxon-travel-active', activeFilter())
})

watch(styleUrl, (url) => {
  if (map && url) {
    styleLoaded = false
    tileSources = undefined
    map.setStyle(url)
  }
})
</script>

<template>
  <Teleport v-if="mounted" to=".field-shell">
    <div
      class="travel-map"
      :class="{ 'travel-map--ready': ready }"
      :style="{ '--travel-map-opacity': travel.opacity ?? 0.42 }"
      aria-hidden="true"
    >
      <div ref="canvas" class="travel-map__canvas" />
    </div>
  </Teleport>
  <p v-if="ready && travel.attribution" class="travel-map__attribution">
    {{ travel.attribution }}
  </p>
</template>
