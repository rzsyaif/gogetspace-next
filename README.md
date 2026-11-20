# GoGetSpace + Ariyes — UI prototype

Front-end prototype of two connected products, in one repo so they share one design system and one list of tools.
There is no backend: every screen runs on mock data, and the places to plug the real system in are marked.

| Folder | What it is | Dev URL |
| --- | --- | --- |
| [`apps/gogetspace`](apps/gogetspace/README.md) | GoGetSpace: marketing homepage, website builder (generation flow, editor), dashboard | http://localhost:3000 |
| [`apps/ariyes`](apps/ariyes/README.md) | Ariyes Apps: the tools behind a published website (appointments, payments, inbox, CRM…) | http://localhost:3001 |
| [`packages/baseplate`](packages/baseplate/README.md) | Baseplate by GoGetSpace: tokens, base styles, fonts, React components and the theme switch | — |
| [`packages/modules`](packages/modules/README.md) | The tool catalog, the project model, the tile previews' data shapes, and the mock data | — |

## How the two products connect

- A **project is one website.** When someone publishes a GoGetSpace site and signs up, an Ariyes account is created
  with a project of the same name.
- Every project has the **default tools** (Inbox, Contacts, To-Do, Drive, Settings). The **modules** chosen while
  building the site (Appointments, Payments, Estimates, Reviews, Branches, CRM…) arrive **already installed**; more can
  be added from the Ariyes home. Prices are per project, as in GoGetSpace.
- Both apps read the same catalog (`@gogetspace/modules`), so a module's name, icon and price are defined once.

## Getting started

```bash
pnpm install
pnpm dev           # GoGetSpace on :3000
pnpm dev:ariyes    # Ariyes on :3001
```

| Script (from the root) | What it does |
| --- | --- |
| `pnpm build` | Build both apps |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Run in every package that has the script |
| `pnpm tokens` | Regenerate Baseplate's `tokens.css` from the Figma token export |
| `pnpm --filter <app> <script>` | Run one app's script, e.g. `pnpm --filter ariyes build` |

Environment variables (one per app, pointing at the other):

| App | Variable | Used by | Default |
| --- | --- | --- | --- |
| GoGetSpace | `NEXT_PUBLIC_ARIYES_URL` | Modules › Manage, and "new enquiries" on dashboard cards, which open the site's Ariyes project | `http://localhost:3001` in dev, `https://gogetspace-next-pde9.vercel.app` in builds |
| Ariyes | `NEXT_PUBLIC_GOGETSPACE_URL` | "Build another website" in the project switcher | `http://localhost:3000` |

An Ariyes project's id is its GoGetSpace site's id, so `/{siteId}/{tool}` opens the right project. Each GoGetSpace module
maps to its Ariyes tool through `gogetspaceModules` in the catalog; modules with no tool there open the project home.

## Handing off: what's mocked and where to plug in

| What | Mocked in | Replace with |
| --- | --- | --- |
| Ariyes account, projects, tile numbers | `packages/modules/src/mock/index.ts` (`getMe`, `listProjects`, `getProject`, `getPeeks`) | API calls with the same return types. They are async already, so the screens don't change. |
| Installing a tool from the Ariyes home | local state in `apps/ariyes/src/components/home-tools.tsx` (`add`) | an install request (billing + provisioning), then refresh the project |
| GoGetSpace agent (planning, questions, building) | `apps/gogetspace/src/lib/generation`, `src/lib/playbooks` | the real agent. The playbooks describe the reasoning it should follow. See that app's README. |
| Publishing → Ariyes account | not wired yet | on publish + sign-up, create the account and a project named after the site, with the site's modules installed |

## Deploying (Vercel)

One Vercel project per app, both from this repo:

- **GoGetSpace**: Root Directory `apps/gogetspace`
- **Ariyes**: Root Directory `apps/ariyes`

Vercel installs the whole workspace, so the shared packages are available to both.
