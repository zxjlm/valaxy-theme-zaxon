#!/usr/bin/env node
import process from 'node:process'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
async function main() {
  const { generateTravelMaps } = await jiti.import('../node/generate-travel-maps.ts')
  await generateTravelMaps()
}
main().catch((error) => {
  console.error('[zaxon] Map generation failed:', error.message)
  process.exitCode = 1
})
