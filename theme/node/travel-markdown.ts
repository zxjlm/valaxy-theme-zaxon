import type { ValaxyExtendConfig } from 'valaxy'

type MarkdownIt = Parameters<NonNullable<NonNullable<ValaxyExtendConfig['markdown']>['config']>>[0]
type CoreRule = Parameters<MarkdownIt['core']['ruler']['push']>[1]
type StateCore = Parameters<CoreRule>[0]
type Token = StateCore['tokens'][number]

export const TRAVEL_LAYOUT = 'travel'

const COORDINATES = /^(-?\d{1,2}(?:\.\d+)?)\s*[,，]\s*(-?\d{1,3}(?:\.\d+)?)$/

export function parseCoordinates(text: string): { lat: number, lng: number } | null {
  const match = text.trim().match(COORDINATES)
  if (!match)
    return null

  const lat = Number(match[1])
  const lng = Number(match[2])
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180)
    return null

  return { lat, lng }
}

function isBreak(token: Token) {
  return token.type === 'hardbreak' || token.type === 'softbreak'
}

function trailingCoordinates(children: Token[]) {
  let breakIndex = -1
  for (let index = children.length - 1; index >= 0; index -= 1) {
    if (isBreak(children[index])) {
      breakIndex = index
      break
    }
  }

  const tail = children.slice(breakIndex + 1)
  if (!tail.length || tail.some(token => token.type !== 'text'))
    return null

  const text = tail.map(token => token.content).join('').trim()
  const coordinates = parseCoordinates(text)
  if (!coordinates)
    return null

  return { ...coordinates, text, place: children.slice(0, Math.max(breakIndex, 0)) }
}

function span(state: StateCore, className: string, inner: Token[]) {
  const open = new state.Token('travel_stop_span_open', 'span', 1)
  open.attrSet('class', className)
  return [open, ...inner, new state.Token('travel_stop_span_close', 'span', -1)]
}

/**
 * Turns paragraphs ending with a `lat, lng` line into travel stops, e.g.
 *
 * ```md
 * 京都市下京区大坂町 五条駅（K10）
 * 34.995172, 135.759739
 * ```
 *
 * Only applies to pages using `layout: travel`.
 */
export function travelStopsPlugin(md: MarkdownIt) {
  md.core.ruler.push('zaxon_travel_stops', (state) => {
    if (state.env?.frontmatter?.layout !== TRAVEL_LAYOUT)
      return

    let stopIndex = 0
    const { tokens } = state
    for (let index = 0; index < tokens.length - 2; index += 1) {
      const open = tokens[index]
      const inline = tokens[index + 1]
      if (open.type !== 'paragraph_open' || inline.type !== 'inline' || !inline.children || tokens[index + 2].type !== 'paragraph_close')
        continue

      const stop = trailingCoordinates(inline.children)
      if (!stop)
        continue

      open.attrJoin('class', 'travel-stop')
      open.attrSet('data-travel-stop', String(stopIndex))
      open.attrSet('data-lat', String(stop.lat))
      open.attrSet('data-lng', String(stop.lng))

      const coordinates = new state.Token('text', '', 0)
      coordinates.content = stop.text
      inline.children = [
        ...(stop.place.length ? span(state, 'travel-stop__place', stop.place) : []),
        ...span(state, 'travel-stop__coords', [coordinates]),
      ]
      stopIndex += 1
    }
  })
}
