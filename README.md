# Zaxon

Zaxon is a custom Valaxy theme by Harumonia. It follows a quiet Field Notes direction: technical writing, life logs, photos, notes, and quotes live in one low-saturation pixel field.

## Usage

```ts
import type { ThemeConfig } from 'valaxy-theme-zaxon'
import { defineConfig } from 'valaxy'

export default defineConfig<ThemeConfig>({
  theme: 'zaxon',
})
```

## Development

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

The publishable theme lives in `theme/`. The local showcase site lives in `demo/`.

## Credits

Created by Harumonia, built on Valaxy.
