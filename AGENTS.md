# Repository Guidelines

## Project Structure & Module Organization

This is a pnpm workspace for a custom Valaxy theme. The publishable theme lives in `theme/`, with Vue components in `theme/components/`, layouts in `theme/layouts/`, styles in `theme/styles/`, composables in `theme/composables/`, and types in `theme/types/`.

The showcase site lives in `demo/`: Markdown in `demo/pages/`, site-only styles in `demo/styles/`, static files in `demo/public/`, and configuration in `demo/site.config.ts` plus `demo/valaxy.config.ts`. Design references are in `design/`.

## Design & Valaxy References

Use the Valaxy theme guide as the main reference: `https://valaxy.site/zh/themes/write`.

Before changing visual direction, read `design/harumonia-field-notes-theme-spec.md` for the Harumonia Field Notes concept, priorities, navigation, tone, colors, and interaction principles. Treat `design/demo_page.png` as the original visual target.

## Build, Test, and Development Commands

- `pnpm install`: install workspace dependencies using the pinned pnpm version.
- `pnpm dev` or `pnpm demo`: start the Valaxy demo site for local development.
- `pnpm build`: build the demo with SSG through `demo`.
- `pnpm lint`: run ESLint across the workspace.
- `pnpm typecheck`: run `vue-tsc` with strict TypeScript checks.
- `pnpm ci:publish`: publish workspace packages; only use during release work.

## Coding Style & Naming Conventions

Use TypeScript, Vue SFCs, and ESM. Follow the Antfu ESLint config in `eslint.config.js`, including UnoCSS and formatter rules. Prefer two-space indentation, single quotes, and concise imports.

Name Vue components in PascalCase. Starter components currently use the `Starter*` prefix; if renaming the theme, keep components under a clear theme namespace as noted in `README.md`. Keep shared theme styles in `theme/styles/` and demo-only overrides in `demo/styles/`.

## Testing Guidelines

There are no dedicated test files yet. CI validates `pnpm lint`, `pnpm typecheck`, and `pnpm build` on Linux and Windows. When adding logic that benefits from tests, place Vitest specs near the source as `*.spec.ts` or `*.test.ts`, and add a matching script before relying on it in CI.

## Commit & Pull Request Guidelines

The history contains only `init`, so no strict convention is established. Use short imperative subjects such as `Add theme navigation styles` or `Fix demo archive page`.

Pull requests should include a summary, commands run, linked issues, and screenshots for visual changes. Note changes to package names, theme identifiers, release settings, or public assets.

## Security & Configuration Tips

Do not commit npm tokens or deployment secrets. GitHub Actions expects release credentials such as `NPM_TOKEN` to be configured as repository secrets. Keep generated directories such as `node_modules`, `dist`, and `.valaxy` out of commits.
