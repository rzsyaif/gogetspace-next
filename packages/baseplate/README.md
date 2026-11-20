# @gogetspace/baseplate

Baseplate by GoGetSpace: the design system both apps use.

- `tokens/baseplate.tokens.json`: exported from the Baseplate Figma library. Run `pnpm tokens` (repo root) to regenerate
  `src/styles/tokens.css`. Never edit `tokens.css` by hand.
- `src/styles/baseplate.css`: tokens, the dark-mode variant, motion curves, keyframes and the `focus-ring`,
  `shimmer-text` and `studs` utilities.
- `src/ui`: the components (`import { Button } from "@gogetspace/baseplate"`).
- `src/cn.ts`: class merging that knows the `type-*` utilities (`@gogetspace/baseplate/cn`).
- `src/theme.tsx`: `ThemeScript` (put in `<head>`) and `ThemeToggle` (`@gogetspace/baseplate/theme`).
- `fonts/`: Bricolage Grotesque, Geist and Geist Mono (SIL Open Font License).

Using it in an app:

1. Add `"@gogetspace/baseplate": "workspace:*"` to the app's dependencies and `transpilePackages: ["@gogetspace/baseplate"]` to `next.config.ts`.
2. In the app's `globals.css`:
   ```css
   @import "tailwindcss";
   @import "@gogetspace/baseplate/styles.css";
   @source "../../../../packages/baseplate/src"; /* so Tailwind sees the components' classes */
   ```
3. Load the fonts with `next/font/local` from `packages/baseplate/fonts` (see `apps/ariyes/src/app/fonts.ts`) and put their variables on `<html>`.

Every component, in light and dark, with usage and source: GoGetSpace's `/styleguide`.
