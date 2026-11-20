# Ariyes Apps — UI prototype

> Part of the GoGetSpace monorepo: see the [root README](../../README.md).

The tools workspace behind a published website (apps.ariyes.net). Styled with Baseplate; data from
`@gogetspace/modules` (mock).

```bash
pnpm dev     # http://localhost:3001 (from this folder; or `pnpm dev:ariyes` from the root)
```

| Route | What it is |
| --- | --- |
| `/` | Opens the first project |
| `/[project]` | A project's home: a tile per tool with a sneak peek of its latest numbers, then add-ons to add |
| `/[project]/[tool]` | A tool's screen (placeholder until each tool is designed) |

- **Top bar** (`components/top-bar.tsx`): the project switcher lists the person's websites (one project each) and links
  to GoGetSpace to build another; "View website", theme switch, account.
- **Tiles** (`components/home-tools.tsx`, `components/peek.tsx`): installed add-ons and default tools in a fixed order
  (what a practice checks first, Settings last). Each tool's preview has an empty state for a project that hasn't
  used it yet. Adding a tool from the list is local to the prototype.
