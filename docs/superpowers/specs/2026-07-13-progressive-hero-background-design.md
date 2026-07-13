# Progressive Hero Background Design

## Goal

Make the home-page hero feel complete on slow connections without delaying the page's text and controls. A small WebP preview appears first, then the matching full-resolution image fades in only after it has downloaded and decoded.

## Assets

- Keep the four existing PNG hero images as the high-quality source and final display assets.
- Generate four matching low-quality WebP assets: light and dark, each in desktop and mobile crops.
- Preserve each source image's aspect ratio. The low-quality assets are downscaled and compressed to target roughly 20–60 KB per file.

## Rendering and Load Sequence

1. The home page renders the selected low-quality image as an absolutely positioned image layer from the initial markup. It is the only hero background requested at high priority.
2. Once mounted, the page determines the current color scheme and viewport breakpoint using the existing rules: dark class and `max-width: 640px`.
3. The matching high-quality PNG is created as an off-DOM `Image` and requested after the low-quality layer has loaded, using an idle callback with a short timeout.
4. The high-quality layer becomes visible only after `Image.decode()` resolves. It fades in over 220 ms while the preview remains underneath.
5. Theme or breakpoint changes replace the preview immediately and begin loading only the newly selected high-quality asset. Stale image completions cannot overwrite the current selection.

## Network and Accessibility Behaviour

- If `navigator.connection.saveData` is enabled or the effective connection type is `slow-2g` or `2g`, do not request the high-quality PNG.
- If the high-quality image fails to load or decode, retain the WebP preview without exposing an error state.
- The decorative hero image has empty alt text. It remains behind the readable hero content and does not alter the page structure.
- Respect `prefers-reduced-motion`: apply no cross-fade transition in that mode.

## Test and Verification

- Unit-test the image-selection and high-quality-loading policy separately from the Vue component: desktop/mobile and light/dark mappings; save-data and 2G skips; stale request completions are ignored.
- Check generated asset dimensions and file sizes.
- Run the focused Vitest suite, type checking, linting, and the static build. Inspect the homepage at desktop and 375 px widths, including a simulated slow network if the environment supports it.

## Scope

This work changes only the home-page hero background and its four derived preview assets. It does not convert or change other image assets, alter theme colors, or add a global loading screen.
