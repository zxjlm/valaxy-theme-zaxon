import { describe, expect, it } from 'vitest'
import { TRAVEL_MAP_SIZES } from '../node/travel-native'
import { flyInterpolator } from './travel'
import { motionFrameIndex, travelMotionPlan, travelRasterTransform } from './travel-motion'

const points = [{ lat: 34.436444, lng: 135.242278 }, { lat: 34.720211, lng: 135.503339 }, { lat: 34.995172, lng: 135.759739 }]

describe('travel motion samples', () => {
  it('samples every leg including departure and return to the overview', () => {
    const plan = travelMotionPlan(points, TRAVEL_MAP_SIZES.desktop, 14)
    expect(plan.segments).toHaveLength(points.length + 1)
    for (const segment of plan.segments) {
      expect(segment[0].t).toBe(0)
      expect(segment.at(-1)!.t).toBe(1)
      expect(segment.length).toBeGreaterThan(2)
    }
    expect(plan.segments[0][0].camera).toEqual(plan.segments.at(-1)!.at(-1)!.camera)
    expect(plan.segments[1][0].camera).toEqual({ ...points[0], zoom: 14 })
    expect(plan.segments[1].at(-1)!.camera).toEqual({ ...points[1], zoom: 14 })
    expect(Math.min(...plan.segments[1].map(frame => frame.camera.zoom))).toBeLessThan(14)
  })

  it('keeps the viewport covered between samples throughout each fly path', () => {
    for (const [size, view] of Object.entries(TRAVEL_MAP_SIZES)) {
      const plan = travelMotionPlan(points, view, 14)
      for (const frames of plan.segments) {
        const fly = flyInterpolator(frames[0].camera, frames.at(-1)!.camera, Math.max(view.width - view.padding.right, view.height - view.padding.top - view.padding.bottom))
        for (let step = 0; step <= 200; step += 1) {
          const t = step / 200
          const frame = frames[motionFrameIndex(frames, t)]
          for (const [width, height] of size === 'desktop' ? [[950, 1000], [1584, 900], [568, 1000]] : [[390, 608], [768, 738]])
            expect(travelRasterTransform(frame.camera, fly(t), plan, width, height).covers).toBe(true)
        }
      }
    }
  })

  it('moves the same raster continuously for small reading progress changes', () => {
    const plan = travelMotionPlan(points, TRAVEL_MAP_SIZES.desktop, 14)
    const frames = plan.segments[1]
    const fly = flyInterpolator(frames[0].camera, frames.at(-1)!.camera, 1036)
    const t = (frames[3].t + frames[4].t) / 2 - 0.001
    const reference = frames[motionFrameIndex(frames, t)]
    expect(motionFrameIndex(frames, t + 0.0005)).toBe(motionFrameIndex(frames, t))
    const before = travelRasterTransform(reference.camera, fly(t), plan, 950, 1000)
    const after = travelRasterTransform(reference.camera, fly(t + 0.0005), plan, 950, 1000)
    expect(after.x).not.toBe(before.x)
    expect(after.width).not.toBe(before.width)
  })

  it('keeps repeated stops compact and supports zero zoom', () => {
    const plan = travelMotionPlan([points[0], points[0]], TRAVEL_MAP_SIZES.mobile, 14)
    expect(plan.segments[1]).toHaveLength(2)
    const zero = travelMotionPlan([points[0]], TRAVEL_MAP_SIZES.desktop, 0)
    expect(zero.segments.flat().every(frame => frame.camera.zoom >= 0)).toBe(true)
  })
})
