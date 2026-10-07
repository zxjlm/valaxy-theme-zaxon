import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'

import { parseCoordinates, travelStopsPlugin } from './travel-markdown'

function render(source: string, layout = 'travel') {
  const md = new MarkdownIt()
  travelStopsPlugin(md as any)
  return md.render(source, { frontmatter: { layout } })
}

describe('parseCoordinates', () => {
  it('parses decimal latitude and longitude', () => {
    expect(parseCoordinates('34.436444, 135.242278')).toEqual({ lat: 34.436444, lng: 135.242278 })
    expect(parseCoordinates(' -33.86，151.2 ')).toEqual({ lat: -33.86, lng: 151.2 })
  })

  it('rejects out-of-range or non-coordinate text', () => {
    expect(parseCoordinates('95.1, 10')).toBeNull()
    expect(parseCoordinates('10, 181')).toBeNull()
    expect(parseCoordinates('17:14 开往京都')).toBeNull()
  })
})

describe('travelStopsPlugin', () => {
  it('marks address paragraphs that end with coordinates', () => {
    const html = render([
      '大阪府泉佐野市泉州空港北1　エアロプラザ前广场  ',
      '34.436444, 135.242278',
      '',
      '京都市下京区大坂町　五条駅（K10）',
      '34.995172, 135.759739',
    ].join('\n'))

    expect(html).toContain('<p class="travel-stop" data-travel-stop="0" data-lat="34.436444" data-lng="135.242278">')
    expect(html).toContain('<span class="travel-stop__place">大阪府泉佐野市泉州空港北1　エアロプラザ前广场</span>')
    expect(html).toContain('<span class="travel-stop__coords">34.436444, 135.242278</span>')
    expect(html).toContain('data-travel-stop="1" data-lat="34.995172" data-lng="135.759739"')
  })

  it('keeps inline formatting inside the place label', () => {
    const html = render('**五条駅** K10  \n34.995172, 135.759739')
    expect(html).toContain('<span class="travel-stop__place"><strong>五条駅</strong> K10</span>')
  })

  it('leaves ordinary paragraphs and non-travel pages untouched', () => {
    expect(render('离发车只剩几分钟。\n这班是 17:14 开往京都的特急。')).not.toContain('travel-stop')
    expect(render('五条駅  \n34.995172, 135.759739', 'post')).not.toContain('travel-stop')
  })
})
