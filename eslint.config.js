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
      // Keep bundled OFL license texts unmodified.
      'theme/assets/fonts/**',
    ],
  },
  {
    // Trailing double spaces are Markdown hard breaks, and CJK prose uses ideographic spaces.
    files: ['**/*.md'],
    rules: {
      'no-irregular-whitespace': 'off',
      'style/no-trailing-spaces': 'off',
    },
  },
)
