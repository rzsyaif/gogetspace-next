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

Theme: **light by default** on every page. `<ThemeToggle />` switches to Dark, or to System (follows the OS); the choice is saved in `localStorage` and applied as `data-theme` on `<html>` before first paint.

## Components

`src/components/ui` mirrors the Baseplate component set:

Button (sm/md/lg/icon × primary/secondary/ghost/destructive, with the lego press), Logo, Badge, Chip, Avatar,
Field + Input + Textarea, Select, DropdownMenu, Checkbox, Switch, Tabs, Tooltip, Dialog (modal), Alert, Toast,
ProgressBar, Card and StudsMedia.

App components built for the generation flow (also on `/styleguide` → App patterns):

- **SegmentedControl** — pill switch for plan, device size, theme, Chat/Preview and Preview/Edit Mode (radio group or
  tabs; `look="floating"` for bars over content; arrow keys move the selection)
- **IconButton** — quiet icon-only button for close, reload, zoom and row menus
- **StepList / Step / StepIndicator** — vertical task list whose markers are joined by one continuous line
- **PromptBox**, **PromptAttachButton**, **PromptSendButton**, **AttachmentChip** — the chat and "create your own style" boxes
- **Drawer** — side panel (the phone editor menu)
- **RadioCard** / **RadioDot** — bordered radio choices (publish domain, style options)
- **Alert** now also has a `neutral` tone, `actions`, a custom or hidden `icon` and a compact `size="sm"`

The marketing homepage prompt (`site/prompt-input.tsx`) keeps its own Figma-matched motion buttons, and the generated
site (`bakti-site/`) uses its own themed components on purpose.

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

`src/app/page.tsx` composes the sections in `src/components/site`. The closing call-to-action and footer sit on the Figma footer
background (`site/footer-background.tsx`): the colour wash in `public/images/footer-bg.svg` with Figma's Pixelate
shader on top, via the Figma shader runtime in `src/lib/shader-runtime` and the shader in `src/lib/custom-effects`
(both copied as exported; lint skips them). The shader needs WebGPU + HTML-in-Canvas; other browsers show the wash
without the pixel pattern. The page is always light (`data-theme="light"`).

- **Pixel Blocks** (`pixel-blocks.tsx`): canvas falling-blocks game behind the hero. Clicking drops the next piece at the cursor.
  When the visitor focuses a prompt input, the board dissolves; it rebuilds when they cancel or scroll away (`prompt-events.ts`).
- **Prompt input** (`prompt-input.tsx`): demo attachments, Enter to "generate", animated outline and glow.
- **How it works**: a sticky panel. Each 100vh of scroll is one step, and the bars show real scroll progress.
- **Feature cards**: illustrations animate on hover, or when scrolled into view on touch screens.
- Images still load from the Framer CDN (`assets.ts`, allowed in `next.config.ts`). Move them to `/public` when the Framer site is retired.

## Generation flow

Typing a prompt on the homepage opens `/generate`. A scripted agent (`src/lib/generation/state.ts`, timers in
`gen-provider.tsx`) plans the site, then the person reviews three artifacts in a sheet: an editable brief (guesses are
highlighted until confirmed), style options previewed on one hero section, and a sitemap (list and map side by side, with
rename / add / remove, plan limits and the sections planned for each page). "Start Creation" opens the workspace: chat, build progress, credits, and a
preview of the generated site with device sizes and a page switcher. Sign-up is asked for only when publishing.

Style step and tokens: the hero (`bakti-site/hero-preview.tsx`) is generated once from the brief with a fixed layout;
each style option is only a set of ~15 design tokens (palette, fonts, radii) applied as CSS variables. Comparing or
switching styles costs no generation, and the full site (with its own layouts) is generated once, after confirming.

Product decisions built in: a follow-up sent while planning **restarts the plan**; **sign-up happens at Publish**.

Transitions: sending the homepage prompt plays a hand-off (`site/launch-overlay.tsx`) — the homepage fades into the light
`/generate` canvas while the prompt box stays, the box glides to the chat input position and the prompt lifts into the first bubble, then `/generate` takes over
in the same place. When planning finishes the brief review opens by itself; closing it leaves the filled chat. After
"Start Creation" one layout (`generate-app.tsx`) animates: the sheet closes, the chat shrinks into the sidebar, the rail
(logo, tabs, Account) and the preview slide in, and the top bar folds away.

Edit Mode: the preview has a Preview Mode / Edit Mode switch. In Edit Mode the site's `EditBridge`
(`bakti-site/edit-bridge.tsx`, active only inside the preview iframe) outlines what's under the pointer and reports
clicks; the editor shows a menu: sections → ask the agent; text → edit it in place or ask the agent; images → upload
your own or regenerate with a prompt. Requests go to the agent chat. Edits live in the preview until it reloads.

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
