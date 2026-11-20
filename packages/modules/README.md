# @gogetspace/modules

The shared model of a project and its tools.

- `src/catalog.ts`: every tool (`TOOLS`): id, name, one-line description, icon (a lucide name), default or add-on,
  monthly price, and the GoGetSpace module that installs it. Plain data, so a backend can use the same list.
- `src/project.ts`: `Project` (one website: name, domain, plan, installed add-ons) and `Member`.
- `src/peeks.ts`: `PeekMap`, the few numbers each tool shows on its Ariyes home tile.
- `src/mock/`: **mock data**. `getMe`, `listProjects`, `getProject` and `getPeeks` are what the screens call.
  Replace their bodies with API calls returning the same types.
