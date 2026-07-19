// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    unocss: true,
    formatters: true,
  },
  {
    ignores: [
      '**/.valaxy/**',
      '**/dist/**',
      'demo/public/atom.xml',
      'demo/public/feed.*',
      'demo/public/valaxy-fuse-list.json',
      // Planning documents contain partial code excerpts, not standalone source files.
      'docs/superpowers/**',
    ],
  },
)
