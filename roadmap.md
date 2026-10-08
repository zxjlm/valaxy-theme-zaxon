# Roadmap

## Travel map

### Done

- Travel layout with scroll-linked MapLibre backdrop (OpenFreeMap positron / fiord).
- Markdown stop syntax (`place` + `lat, lng`) and itinerary aside.
- Tile load scheduler: start delay, LIFO live queue, in-flight dedupe, LRU cache, predictive prefetch.
- Smaller rendered canvas so masked regions do not request tiles.

### Next

- **Self-host regional tiles.** Per-tile TTFB from OpenFreeMap is still ~0.5 s on the author network; the scheduler cannot remove that. Package the Kansai (or active trip) coverage as PMTiles on Cloudflare R2 (or another nearby CDN) and point the travel style at that source so cold loads are dominated by CDN latency instead of a distant free tile endpoint.

### Later

- Home mini-route preview for recent travel posts.
- Multi-day travel navigation across related posts.
- Optional ±1 km precision circles around stops.
