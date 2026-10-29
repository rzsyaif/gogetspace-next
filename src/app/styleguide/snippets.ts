/**
 * Copy-paste usage for each component on the style guide. `file` is the component's source (shown in the
 * Source tab), `from` the import path. Keep these in step with the components' props.
 */
export interface Snippet {
  name: string
  file: string
  from: string
  exports: string[]
  usage: string
}

const UI = "@/components/ui"

export const SNIPPETS: Record<string, Snippet[]> = {
  buttons: [
    {
      name: "Button",
      file: "src/components/ui/button.tsx",
      from: UI,
      exports: ["Button"],
      usage: `import Link from "next/link"
import { ArrowRight, Pencil, Plus, Trash2 } from "lucide-react"

// variant: primary (default) | secondary | ghost | link | destructive
// size: sm | md (default) | lg | icon-sm | icon-md
<Button>Start building</Button>
<Button variant="secondary" leadingIcon={<Pencil />}>Edit brief</Button>
<Button variant="ghost">Log in</Button>
<Button variant="destructive" leadingIcon={<Trash2 />}>Delete site</Button>
<Button size="lg" trailingIcon={<ArrowRight />}>Continue</Button>
<Button variant="link">Forgot password?</Button>
<Button disabled>Disabled</Button>

// icon only — always give it a label
<Button size="icon-md" aria-label="New site"><Plus /></Button>

// as a link (keeps the button look)
<Button asChild variant="secondary">
  <Link href="/dashboard">Go to dashboard</Link>
</Button>`,
    },
    {
      name: "IconButton",
      file: "src/components/ui/icon-button.tsx",
      from: UI,
      exports: ["IconButton", "iconButtonVariants"],
      usage: `import { MoreHorizontal, RefreshCw, X } from "lucide-react"

// quiet icon-only button for toolbars and row actions (no block shadow)
// size: xs | sm | md (default) | lg | xl · shape: square | round · tone: default | muted | onSubtle | filled | onDark
<IconButton aria-label="Reload"><RefreshCw /></IconButton>
<IconButton aria-label="More" tone="muted"><MoreHorizontal /></IconButton>
<IconButton aria-label="Close" size="lg" shape="round" tone="filled"><X /></IconButton>

// style a link or trigger like an icon button
<a href="/preview" aria-label="Open preview" className={iconButtonVariants({ size: "lg", shape: "round" })}>…</a>`,
    },
  ],
  forms: [
    {
      name: "Field + Input",
      file: "src/components/ui/field.tsx",
      from: UI,
      exports: ["Field", "Input", "Textarea"],
      usage: `import { Globe, Search } from "lucide-react"

// Field wires the label, helper and error text to the control inside it
<Field label="Business name" helper="Shown on your site header">
  <Input placeholder="e.g. Rahma Family Clinic" />
</Field>

<Field label="Domain" error="This domain is already taken">
  <Input defaultValue="baktianalisa.com" leadingIcon={<Globe />} />
</Field>

<Input placeholder="Search your sites" aria-label="Search" leadingIcon={<Search />} />

<Field label="About your business" helper="A sentence or two is enough">
  <Textarea rows={3} placeholder="A clinical laboratory in Penang…" />
</Field>`,
    },
    {
      name: "Select",
      file: "src/components/ui/select.tsx",
      from: UI,
      exports: ["Select", "Field"],
      usage: `const [type, setType] = useState("lab")

<Field label="Practice type">
  <Select
    value={type}
    onValueChange={setType}
    placeholder="Choose one"
    options={[
      { value: "medical", label: "Medical clinic" },
      { value: "dental", label: "Dental practice" },
      { value: "lab", label: "Clinical laboratory" },
    ]}
  />
</Field>`,
    },
    {
      name: "Checkbox & Switch",
      file: "src/components/ui/controls.tsx",
      from: UI,
      exports: ["Checkbox", "Switch"],
      usage: `const [on, setOn] = useState(false)

<Checkbox label="Show opening hours on my site" defaultChecked />
<Checkbox label="Add a booking page" description="Visitors can pick a date and time" />
<Checkbox label="Select all pages" checked="indeterminate" />

<Switch label="Publish site automatically" checked={on} onCheckedChange={setOn} />`,
    },
    {
      name: "RadioCard",
      file: "src/components/ui/controls.tsx",
      from: UI,
      exports: ["RadioCard"],
      usage: `const [domain, setDomain] = useState<"free" | "own">("free")

<fieldset className="flex flex-col gap-2">
  <legend className="mb-2 type-label-md">Where should it live?</legend>
  <RadioCard name="domain" checked={domain === "free"} onChange={() => setDomain("free")}
    title="bakti-analisa.get.space" description="Free address, ready instantly." />
  <RadioCard name="domain" checked={domain === "own"} onChange={() => setDomain("own")}
    title="Use a domain I already own">
    {/* optional extra content shows inside the card */}
  </RadioCard>
</fieldset>`,
    },
    {
      name: "SegmentedControl",
      file: "src/components/ui/segmented-control.tsx",
      from: UI,
      exports: ["SegmentedControl"],
      usage: `import { Monitor, Smartphone, Tablet } from "lucide-react"

const [plan, setPlan] = useState("starter")
<SegmentedControl
  label="Plan"
  value={plan}
  onChange={setPlan}
  options={[
    { value: "free", label: "Free" },
    { value: "starter", label: "Starter", tooltip: "Up to 5 pages" },
    { value: "business", label: "Business" },
  ]}
/>

// icon only, small; look="floating" for bars over content; as="tablist" for tabs; fill to stretch
<SegmentedControl label="Device" size="sm" iconOnly value={device} onChange={setDevice}
  options={[
    { value: "desktop", label: "Desktop", icon: <Monitor /> },
    { value: "tablet", label: "Tablet", icon: <Tablet /> },
    { value: "mobile", label: "Mobile", icon: <Smartphone /> },
  ]} />`,
    },
  ],
  menus: [
    {
      name: "DropdownMenu",
      file: "src/components/ui/dropdown-menu.tsx",
      from: UI,
      exports: ["Button", "DropdownMenu", "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuLabel", "DropdownMenuSeparator", "DropdownMenuTrigger"],
      usage: `import { Globe, Pencil, Trash2 } from "lucide-react"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="secondary">Site actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="start">
    <DropdownMenuLabel>Bakti Analisa</DropdownMenuLabel>
    <DropdownMenuItem onSelect={() => edit()}><Pencil /> Edit site</DropdownMenuItem>
    <DropdownMenuItem><Globe /> Connect domain</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem tone="danger"><Trash2 /> Delete site</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
    },
    {
      name: "Dialog",
      file: "src/components/ui/dialog.tsx",
      from: UI,
      exports: ["Button", "Dialog", "DialogClose", "DialogContent", "DialogTrigger", "Field", "Input"],
      usage: `// controlled: <Dialog open={open} onOpenChange={setOpen}>
<Dialog>
  <DialogTrigger asChild>
    <Button>Connect domain</Button>
  </DialogTrigger>
  <DialogContent
    title="Connect your domain"
    description="Type the domain you already own."
    className="max-w-[560px]" // default width is 480px
    footer={
      <>
        <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
        <Button onClick={connect}>Connect domain</Button>
      </>
    }
  >
    <Field label="Domain">
      <Input placeholder="yourpractice.com" />
    </Field>
  </DialogContent>
</Dialog>

// the blurred scrim is shared: use overlayClass for custom overlays
import { overlayClass } from "@/components/ui"`,
    },
    {
      name: "Drawer",
      file: "src/components/ui/drawer.tsx",
      from: UI,
      exports: ["Drawer", "DrawerContent", "DrawerTrigger", "IconButton"],
      usage: `import { Menu } from "lucide-react"

const [open, setOpen] = useState(false)
<Drawer open={open} onOpenChange={setOpen}>
  <DrawerTrigger asChild>
    <IconButton aria-label="Open menu" size="lg" shape="round" tone="filled"><Menu /></IconButton>
  </DrawerTrigger>
  <DrawerContent title="Menu" side="left" footer={<Button className="w-full">Sign out</Button>}>
    {/* NavItem list, settings… */}
  </DrawerContent>
</Drawer>`,
    },
    {
      name: "Tabs",
      file: "src/components/ui/tabs.tsx",
      from: UI,
      exports: ["Tabs", "TabsContent", "TabsList", "TabsTrigger"],
      usage: `<Tabs defaultValue="pages" className="flex flex-col gap-4">
  <TabsList aria-label="Editor panels">
    <TabsTrigger value="pages">Pages</TabsTrigger>
    <TabsTrigger value="style">Style</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="pages">Home, Tests & Packages, About…</TabsContent>
  <TabsContent value="style">Clinical Clarity</TabsContent>
  <TabsContent value="settings">Domain, SEO and integrations</TabsContent>
</Tabs>`,
    },
    {
      name: "Tooltip",
      file: "src/components/ui/tooltip.tsx",
      from: UI,
      exports: ["Button", "Tooltip"],
      usage: `import { Plus } from "lucide-react"

// side: top (default) | bottom | left | right — the child must accept a ref (buttons, links)
<Tooltip content="New site" side="right">
  <Button size="icon-md" aria-label="New site"><Plus /></Button>
</Tooltip>`,
    },
  ],
  feedback: [
    {
      name: "Alert",
      file: "src/components/ui/feedback.tsx",
      from: UI,
      exports: ["Alert", "Button"],
      usage: `// tone: neutral | info (default) | success | warning | error · size: md | sm
<Alert tone="success" title="Site published">bakti-analisa.get.space is live.</Alert>

<Alert tone="error" title="Payment failed" onDismiss={() => setShown(false)}>
  Update your card to keep your site online.
</Alert>

// compact, with actions beside the text; icon={false} hides the icon
<Alert tone="warning" size="sm" actions={<Button size="sm">Refresh</Button>}>
  You changed the brief after confirming this.
</Alert>`,
    },
    {
      name: "Toast",
      file: "src/components/ui/feedback.tsx",
      from: UI,
      exports: ["Toast"],
      usage: `// presentational: position and timing are up to you (e.g. fixed bottom-6, hide after 3 s)
// tone: success | error | info | processing
<div aria-live="polite" className="fixed inset-x-0 bottom-6 z-50 flex justify-center">
  {toast && <Toast tone="success" message="Changes saved" action={{ label: "Undo", onClick: undo }} />}
</div>`,
    },
    {
      name: "ProgressBar",
      file: "src/components/ui/feedback.tsx",
      from: UI,
      exports: ["ProgressBar"],
      usage: `<ProgressBar value={62} label="Building your pages…" />

// no visible label: give it an accessible name
<ProgressBar value={credits} ariaLabel="Credits used this month" />`,
    },
  ],
  display: [
    {
      name: "Badge",
      file: "src/components/ui/badge.tsx",
      from: UI,
      exports: ["Badge"],
      usage: `// tone: neutral (default) | brand | success | warning | error · look: subtle (default) | solid
<Badge tone="success">Live</Badge>
<Badge>Draft</Badge>
<Badge tone="brand" dot={false}>Starter</Badge>
<Badge tone="error" look="solid">Past due</Badge>`,
    },
    {
      name: "Chip",
      file: "src/components/ui/chip.tsx",
      from: UI,
      exports: ["Chip"],
      usage: `import { Sparkles } from "lucide-react"

// suggestions and filters; selected toggles the blue state (aria-pressed)
<Chip icon={<Sparkles />} selected={picked === "booking"} onClick={() => setPicked("booking")}>
  Add a booking page
</Chip>`,
    },
    {
      name: "Avatar",
      file: "src/components/ui/avatar.tsx",
      from: UI,
      exports: ["Avatar"],
      usage: `// size: sm | md (default) | lg · shows initials, a photo with src, or a person icon
<Avatar name="Frank Tan" />
<Avatar name="Frank Tan" size="lg" src="/avatars/frank.jpg" />
<Avatar size="sm" />`,
    },
    {
      name: "Card",
      file: "src/components/ui/card.tsx",
      from: UI,
      exports: ["Badge", "Button", "Card", "StudsMedia"],
      usage: `// interactive adds the hover lift; selected the blue border
<Card interactive selected={chosen} className="flex flex-col">
  <StudsMedia />
  <div className="flex flex-col gap-2 p-5">
    <h3 className="type-h6">Clinical lab</h3>
    <p className="type-body-sm text-fg-secondary">Test menu, packages and doctor referrals.</p>
  </div>
  <div className="px-5 pb-5">
    <Button size="sm" variant="secondary">Use template</Button>
  </div>
</Card>`,
    },
    {
      name: "Accordion",
      file: "src/components/ui/accordion.tsx",
      from: UI,
      exports: ["Accordion", "AccordionContent", "AccordionItem", "AccordionTrigger"],
      usage: `// type="single" collapsible: one open at a time · type="multiple": several · no defaultValue = all collapsed
<Accordion type="single" collapsible className="flex flex-col gap-3">
  <AccordionItem value="hours">
    <AccordionTrigger meta="3 locations">Opening hours</AccordionTrigger>
    <AccordionContent>Mon–Sat 7:30 am – 6 pm · Sunday 8 am – 1 pm</AccordionContent>
  </AccordionItem>
  <AccordionItem value="prep">
    <AccordionTrigger>Do I need to fast before a blood test?</AccordionTrigger>
    <AccordionContent>Only for glucose and lipid tests.</AccordionContent>
  </AccordionItem>
</Accordion>`,
    },
    {
      name: "Logo",
      file: "src/components/ui/logo.tsx",
      from: UI,
      exports: ["Logo"],
      usage: `<Logo />              // mark + wordmark, 32px
<Logo markOnly size={44} />`,
    },
  ],
  app: [
    {
      name: "Stepper",
      file: "src/components/ui/steps.tsx",
      from: UI,
      exports: ["Stepper"],
      usage: `// horizontal steps; state: done | current | upcoming | warning · onSelect makes steps clickable
<Stepper
  label="Buying a domain"
  onSelect={(i) => i < step && setStep(i)}
  steps={[
    { title: "Find a domain", caption: "rahmasmile.com", state: "done" },
    { title: "Duration", caption: "1–5 years", state: "current" },
    { title: "Payment", caption: "Card on file", state: "upcoming" },
  ]}
/>`,
    },
    {
      name: "StepList",
      file: "src/components/ui/steps.tsx",
      from: UI,
      exports: ["Step", "StepList"],
      usage: `// vertical task list; status: done | running | failed | warning | pending
// connector draws the line to the next step: "active" once reached, "idle" before; leave it off the last step
<StepList>
  <Step status="done" connector="active">
    <span className="type-body-md text-fg-tertiary">Searched the web</span>
    <span className="type-body-sm text-fg-tertiary">Found 6 results</span>
  </Step>
  <Step status="running" current connector="idle">
    <span className="type-body-md shimmer-text">Drafting the brief</span>
  </Step>
  <Step status="pending">
    <span className="type-body-md text-fg-disabled">Planning the pages</span>
  </Step>
</StepList>`,
    },
    {
      name: "NavItem",
      file: "src/components/ui/nav-item.tsx",
      from: UI,
      exports: ["Badge", "NavItem"],
      usage: `import { Globe, Plus } from "lucide-react"

// a Link with href, a button without; raised = the primary entry; collapsed = icon only (pass aria-label)
<nav aria-label="Account" className="flex flex-col gap-0.5">
  <NavItem href="/dashboard?new=1" icon={<Plus />} label="New Website" raised />
  <NavItem href="/dashboard/websites" icon={<Globe />} label="Websites" active={path === "/dashboard/websites"}
    trailing={<Badge dot={false}>3</Badge>} />
</nav>`,
    },
    {
      name: "Table",
      file: "src/components/ui/table.tsx",
      from: UI,
      exports: ["Badge", "Table", "TableBody", "TableCell", "TableEmpty", "TableHead", "TableHeaderCell", "TableRow"],
      usage: `// scrolls sideways on phones; cells don't wrap unless you add whitespace-normal; align="right" for numbers
<Table>
  <TableHead>
    <tr>
      <TableHeaderCell>Website</TableHeaderCell>
      <TableHeaderCell>Status</TableHeaderCell>
      <TableHeaderCell align="right">Visitors · 30 d</TableHeaderCell>
    </tr>
  </TableHead>
  <TableBody>
    {sites.length === 0 && <TableEmpty colSpan={3}>No websites yet.</TableEmpty>}
    {sites.map((s) => (
      <TableRow key={s.id}>
        <TableCell>{s.name}</TableCell>
        <TableCell><Badge tone={s.live ? "success" : "neutral"}>{s.live ? "Live" : "Draft"}</Badge></TableCell>
        <TableCell align="right">{s.visitors.toLocaleString()}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`,
    },
    {
      name: "Divider",
      file: "src/components/ui/divider.tsx",
      from: UI,
      exports: ["Divider"],
      usage: `<Divider />
<Divider>or with email</Divider>`,
    },
    {
      name: "PromptBox",
      file: "src/components/ui/prompt-box.tsx",
      from: UI,
      exports: ["AttachmentChip", "PromptAttachButton", "PromptBox", "PromptSendButton"],
      usage: `import { FileText } from "lucide-react"

<PromptBox onSubmit={(e) => { e.preventDefault(); send() }}>
  <AttachmentChip icon={<FileText />} name="Price list 2026.pdf" onRemove={() => remove()} />
  <input aria-label="Message" placeholder="Ask for a change…"
    className="bg-transparent type-body-lg outline-none placeholder:text-fg-tertiary" />
  <span className="flex items-center gap-2">
    <PromptAttachButton />
    <span className="flex-1" />
    <PromptSendButton />
  </span>
</PromptBox>`,
    },
    {
      name: "Panel & DetailCard",
      file: "src/components/account/panel.tsx",
      from: "@/components/account/panel",
      exports: ["DetailCard", "PanelEmpty", "PanelHeader", "PanelPage", "PanelSection"],
      usage: `import { Badge, Button } from "@/components/ui"
import { BarChart3 } from "lucide-react"

// page layout used by the dashboard, editor panels and admin
<PanelPage>
  <PanelHeader title="Domains" description="Every website gets a free address." actions={<Button>Buy a domain</Button>} />
  <PanelSection title="Domains you own">
    <DetailCard label="Free address" value="bakti-analisa.get.space" trailing={<Badge tone="success">Live</Badge>} />
  </PanelSection>
  <PanelEmpty icon={<BarChart3 />} title="No visitors yet" text="Numbers show up a day after you publish." />
</PanelPage>`,
    },
    {
      name: "Charts",
      file: "src/components/account/charts.tsx",
      from: "@/components/account/charts",
      exports: ["AreaChart", "BarList", "StatTile"],
      usage: `// stat tile with a change vs the previous period (upIsGood=false for costs)
<StatTile label="Visitors" value="1,284" delta={0.12} />
<StatTile label="AI cost" value="$75" delta={0.44} upIsGood={false} />

// single-series area chart with hover tooltip and a screen-reader table
<AreaChart label="Visitors per day" unit="visitors" height={220}
  points={days.map((d) => ({ label: d.label, value: d.visitors }))} />

// ranked bars
<BarList rows={[{ label: "Homepage", value: 540 }, { label: "Tests & Packages", value: 320, sub: "28%" }]} />`,
    },
  ],
}

/** files a developer needs before any component works, in the order to add them */
export const SETUP: { file: string; note: string }[] = [
  { file: "src/styles/tokens.css", note: "Colours, radii, shadows, spacing and the type-* utilities, generated from the Figma library (tokens/baseplate.tokens.json)." },
  { file: "src/app/globals.css", note: "Imports Tailwind and the tokens; adds the dark variant, animations and the focus-ring, shimmer-text and studs utilities." },
  { file: "src/lib/cn.ts", note: "Class merging that knows the type-* utilities, so className overrides work." },
  { file: "src/app/fonts.ts", note: "Bricolage Grotesque, Geist and Geist Mono, self-hosted. Put the font variables on <html>." },
]

export const INSTALL = "npm install radix-ui class-variance-authority clsx tailwind-merge lucide-react"
