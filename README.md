# GoGetSpace — app UI prototype

Front-end prototype of the GoGetSpace builder (generating flow, agentic editor, dashboard).
There is no backend: screens run on sample data and a scripted agent.

Built with **Next.js 16** (App Router, Turbopack), **React 19**, **TypeScript**, **Tailwind CSS 4**,
**Radix UI** primitives, **Motion** and **lucide-react**, styled with the **Baseplate by GoGetSpace** design system.

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` / `pnpm start` | Production build / serve it |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Generate route types, then `tsc --noEmit` |
| `pnpm tokens` | Regenerate `src/styles/tokens.css` from `tokens/baseplate.tokens.json` |

Routes:

| Route | What it is |
| --- | --- |
| `/` | Marketing homepage (ported from the Framer site) |
| `/generate?q=…` | Generation flow: plan → review brief, style, sitemap → build → publish |
| `/preview/[style]/[page]` | The generated Bakti Analisa site — 11 pages in every style option |
| `/screens` | Index of the prototype screens |
| `/styleguide` | Every token and component in light and dark |

## Design tokens

`tokens/baseplate.tokens.json` is exported from the Baseplate Figma library (variables, text styles and effect styles).
`pnpm tokens` turns it into `src/styles/tokens.css`, which:

- replaces Tailwind's default palette with Baseplate primitives (`bg-blue-500`, `text-neutral-600`, …)
- adds semantic colors that switch automatically in dark mode
- maps radius (`rounded-sm|md|lg|xl|full` = 6/10/16/24/999px) and shadows (`shadow-block-sm|md|lg`, `shadow-soft-sm|md|lg`)
- defines one utility per Figma text style; sizes drop to the mobile scale below 810px

Don't edit `tokens.css` by hand — change the JSON (or re-export from Figma) and run `pnpm tokens`.

### Cheat sheet

| Figma | Tailwind |
| --- | --- |
| `color/bg/canvas`, `surface`, `subtle`, `muted`, `inverse` | `bg-canvas`, `bg-surface`, `bg-subtle`, `bg-muted`, `bg-inverse` |
| `color/text/primary`, `secondary`, `tertiary`, `brand`, `link` | `text-fg-primary`, `text-fg-secondary`, `text-fg-tertiary`, `text-fg-brand`, `text-fg-link` |
| `color/border/default`, `strong` | `border-line-default`, `border-line-strong` |
| `color/action/primary/default`, `hover`, `pressed` | `bg-action-primary`, `bg-action-primary-hover`, `bg-action-primary-pressed` |
| `color/status/success/bg` … | `bg-status-success-bg`, `text-status-success-text`, … |
| Heading/H2, Body/Small, Label/Medium … | `type-h2`, `type-body-sm`, `type-label-md`, … |
| Effect `Block/Medium`, `Soft/Medium`, `Focus/Ring` | `shadow-block-md`, `shadow-soft-md`, `focus-ring` |

Theme: the OS setting is used by default; `<ThemeToggle />` forces light or dark (`data-theme` on `<html>`, saved in `localStorage`).

## Components

`src/components/ui` mirrors the Baseplate component set:

Button (sm/md/lg/icon × primary/secondary/ghost/destructive, with the lego press), Logo, Badge, Chip, Avatar,
Field + Input + Textarea, Select, DropdownMenu, Checkbox, Switch, Tabs, Tooltip, Dialog (modal), Alert, Toast,
ProgressBar, Card and StudsMedia.

```tsx
import { Button, Field, Input } from "@/components/ui"

<Field label="Business name" helper="Shown on your site header">
  <Input placeholder="e.g. Rahma Family Clinic" />
</Field>
<Button size="lg" trailingIcon={<ArrowRight />}>Start building</Button>
```

## Fonts

Bricolage Grotesque (headings) and Geist / Geist Mono (body, code) are self-hosted from `src/fonts`
(SIL Open Font License) via `next/font/local`, so builds don't depend on Google Fonts.

## Homepage

`src/app/page.tsx` composes the sections in `src/components/site`. The page is always light (`data-theme="light"`).

- **Pixel Blocks** (`pixel-blocks.tsx`): canvas falling-blocks game behind the hero. Clicking drops the next piece at the cursor.
  When the visitor focuses a prompt input, the board dissolves; it rebuilds when they cancel or scroll away (`prompt-events.ts`).
- **Prompt input** (`prompt-input.tsx`): demo attachments, Enter to "generate", animated outline and glow.
- **How it works**: a sticky panel. Each 100vh of scroll is one step, and the bars show real scroll progress.
- **Feature cards**: illustrations animate on hover, or when scrolled into view on touch screens.
- Images still load from the Framer CDN (`assets.ts`, allowed in `next.config.ts`). Move them to `/public` when the Framer site is retired.

## Generation flow

Typing a prompt on the homepage opens `/generate`. A scripted agent (`src/lib/generation/state.ts`, timers in
`gen-provider.tsx`) plans the site, then the person reviews three artifacts in a sheet: an editable brief (guesses are
highlighted until confirmed), style options with a live preview of the real site, and a sitemap (map or list, with
rename / add / remove and plan limits). "Start Creation" opens the workspace: chat, build progress, credits, and a
preview of the generated site with device sizes and a page switcher. Sign-up is asked for only when publishing.

Product decisions built in: a follow-up sent while planning **restarts the plan**; **sign-up happens at Publish**.

The session is kept in `sessionStorage`, so a refresh resumes. The **Prototype** button (bottom-left) replays the flow
with an edge case (vague prompt, nothing found online, several matches, search down, a failing or slow step, a declined
request, low or exhausted credits, a page that fails to build), jumps to any stage, and changes the speed.

The generated site lives in `src/components/bakti-site` and reads only theme variables, so every style option restyles
all pages. Content is in `src/lib/bakti`.

## Project layout

```
src/
  app/              routes (App Router)
  components/ui/    Baseplate components
  components/site/  marketing homepage sections (Pixel Blocks, AI prompt input, feature cards, …)
  components/generate/   generation flow (chat, review sheet, workspace, publish, prototype controls)
  components/bakti-site/ the generated client site
  lib/generation/   flow state and the brief; lib/bakti/ site content, themes, sitemap
  components/       app-level pieces (theme toggle, …)
  fonts/            self-hosted font files + licenses
  lib/              helpers (cn)
  styles/tokens.css generated — do not edit
tokens/             Baseplate token source (from Figma)
scripts/            build-tokens.mjs
```
