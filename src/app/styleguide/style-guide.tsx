"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { ArrowRight, Eye, FileText, Globe, LayoutTemplate, Maximize, Minus, Monitor, MoreHorizontal, MousePointerClick, Pencil, Play, Plus, RefreshCw, Search, Settings, Smartphone, Sparkles, Tablet, Trash2, X } from "lucide-react"
import {
  Alert,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  AttachmentChip,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  CopyField,
  Dialog,
  DialogClose,
  Divider,
  DialogContent,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  IconButton,
  Input,
  Logo,
  NavItem,
  ProgressBar,
  PromptAttachButton,
  PromptBox,
  PromptSendButton,
  RadioCard,
  SegmentedControl,
  Select,
  Step,
  StepList,
  Stepper,
  StudsMedia,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toast,
  Tooltip,
  TooltipProvider,
} from "@/components/ui"
import { ThemeToggle } from "@/components/theme"
import { DetailCard } from "@/components/account/panel"
import { CodeBlock, CodeFile, CodePanel } from "./code"
import { INSTALL, SETUP, SNIPPETS } from "./snippets"

const SEMANTIC: { group: string; items: { name: string; className: string }[] }[] = [
  {
    group: "Backgrounds",
    items: [
      { name: "bg-canvas", className: "bg-canvas" },
      { name: "bg-surface", className: "bg-surface" },
      { name: "bg-surface-raised", className: "bg-surface-raised" },
      { name: "bg-subtle", className: "bg-subtle" },
      { name: "bg-muted", className: "bg-muted" },
      { name: "bg-inverse", className: "bg-inverse" },
    ],
  },
  {
    group: "Actions",
    items: [
      { name: "action-primary", className: "bg-action-primary" },
      { name: "action-primary-hover", className: "bg-action-primary-hover" },
      { name: "action-secondary", className: "bg-action-secondary" },
      { name: "action-ghost-hover", className: "bg-action-ghost-hover" },
      { name: "action-destructive", className: "bg-action-destructive" },
      { name: "action-disabled", className: "bg-action-disabled" },
    ],
  },
  {
    group: "Accents",
    items: [
      { name: "accent-blue", className: "bg-accent-blue" },
      { name: "accent-blue-subtle", className: "bg-accent-blue-subtle" },
      { name: "accent-coral", className: "bg-accent-coral" },
      { name: "accent-coral-subtle", className: "bg-accent-coral-subtle" },
      { name: "accent-yellow", className: "bg-accent-yellow" },
      { name: "accent-yellow-subtle", className: "bg-accent-yellow-subtle" },
      { name: "accent-green", className: "bg-accent-green" },
      { name: "accent-green-subtle", className: "bg-accent-green-subtle" },
    ],
  },
]

const TYPE = [
  ["type-display", "Your business, online today"],
  ["type-h1", "Build a dream space"],
  ["type-h2", "Simple plans, everything included"],
  ["type-h3", "From a sentence to a live website"],
  ["type-h4", "Connect your domain"],
  ["type-h5", "Plan how your space is built"],
  ["type-h6", "Do I need any technical skills?"],
  ["type-body-lg", "Build a dream space for your business. Start for free."],
  ["type-body-md", "Answer a few questions in plain words. We handle the design."],
  ["type-body-sm", "Hosting and security are already set up."],
  ["type-label-lg", "Start with Business"],
  ["type-label-md", "Start building"],
  ["type-label-sm", "YOUR ALL-IN-ONE WEBSITE SOLUTION"],
  ["type-caption", "Last edited 2 minutes ago"],
] as const

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 flex flex-col gap-6 border-t border-line-default py-12">
      <h2 className="type-h3">{title}</h2>
      {children}
    </section>
  )
}

export function StyleGuide({ palettes, sources }: { palettes: [string, Record<string, string>][]; sources: Record<string, string> }) {
  const [toast, setToast] = useState(false)
  const [alertOpen, setAlertOpen] = useState(true)
  const [progress, setProgress] = useState(50)
  const [selected, setSelected] = useState(1)
  const [plan, setPlan] = useState("starter")
  const [device, setDevice] = useState("desktop")
  const [mode, setMode] = useState(false)
  const [domain, setDomain] = useState("free")

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-40 border-b border-line-default bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
          <Link href="/" className="rounded-md focus-visible:outline-none focus-visible:focus-ring">
            <Logo />
          </Link>
          <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
            {["setup", "colors", "type", "buttons", "forms", "menus", "feedback", "display", "app"].map((s) => (
              <a key={s} href={`#${s}`} className="rounded-sm px-3 py-1.5 type-label-md capitalize text-fg-secondary hover:bg-subtle hover:text-fg-primary">
                {s}
              </a>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-8">
        <div className="flex flex-col gap-3 py-12">
          <Badge tone="brand" className="self-start">Baseplate by GoGetSpace</Badge>
          <h1 className="type-h1">Style guide</h1>
          <p className="max-w-2xl type-body-lg text-fg-secondary">
            Tokens and components generated from the Figma library. Switch the theme in the header to check dark mode. Every
            component has a Code panel (collapsed until you open it): copy its usage, or the whole source file to build with it elsewhere.
          </p>
        </div>

        <Section id="setup" title="Setup">
          <p className="max-w-3xl type-body-md text-fg-secondary">
            The components are React + Tailwind CSS v4 with Radix for behaviour. To use them in another project, install the packages, add these four files,
            then copy the components you need from the Code panels below each group (they import each other from <code className="font-mono text-[13px]">@/components/ui</code>
            , so keep that path or update the imports).
          </p>
          <CodeBlock label="Terminal" code={INSTALL} maxHeight={96} />
          <Accordion type="multiple" className="flex flex-col gap-3">
            {SETUP.map((f) => (
              <CodeFile key={f.file} file={f.file} note={f.note} code={sources[f.file] ?? ""} />
            ))}
          </Accordion>
        </Section>

        <Section id="colors" title="Colors">
          <div className="flex flex-col gap-3">
            {palettes.map(([name, steps]) => (
              <div key={name} className="grid grid-cols-[72px_1fr] items-center gap-3">
                <span className="type-label-md capitalize text-fg-secondary">{name}</span>
                <div className="grid grid-cols-11 overflow-hidden rounded-md border border-line-default">
                  {Object.entries(steps).map(([step, hex]) => (
                    <div key={step} title={`${name}/${step} ${hex}`} className="flex h-12 items-end p-1.5" style={{ background: hex }}>
                      <span className={`hidden type-caption sm:inline ${Number(step) >= 500 ? "text-white/80" : "text-black/60"}`}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {SEMANTIC.map((g) => (
              <div key={g.group} className="flex flex-col gap-2">
                <h3 className="type-label-md text-fg-secondary">{g.group}</h3>
                <ul className="flex flex-col gap-1.5">
                  {g.items.map((i) => (
                    <li key={i.name} className="flex items-center gap-3">
                      <span className={`size-8 shrink-0 rounded-sm border border-line-default ${i.className}`} />
                      <code className="font-mono text-[13px] text-fg-secondary">{i.name}</code>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section id="type" title="Typography">
          <div className="flex flex-col divide-y divide-line-default">
            {TYPE.map(([cls, sample]) => (
              <div key={cls} className="grid gap-2 py-4 md:grid-cols-[160px_1fr] md:items-baseline">
                <code className="font-mono text-[13px] text-fg-tertiary">{cls}</code>
                <p className={cls}>{sample}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="buttons" title="Buttons">
          {(["sm", "md", "lg"] as const).map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-4">
              <span className="w-10 type-label-md text-fg-tertiary">{size}</span>
              <Button size={size}>Start building</Button>
              <Button size={size} variant="secondary" leadingIcon={<Pencil />}>
                Edit brief
              </Button>
              <Button size={size} variant="ghost">
                Log in
              </Button>
              <Button size={size} variant="destructive" leadingIcon={<Trash2 />}>
                Delete site
              </Button>
              <Button size={size} disabled>
                Disabled
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-4">
            <span className="w-10 type-label-md text-fg-tertiary">icon</span>
            <Tooltip content="New site">
              <Button size="icon-md" aria-label="New site">
                <Plus />
              </Button>
            </Tooltip>
            <Tooltip content="Settings">
              <Button size="icon-sm" variant="secondary" aria-label="Settings">
                <Settings />
              </Button>
            </Tooltip>
            <Button variant="primary" trailingIcon={<ArrowRight />}>
              Continue
            </Button>
            <Button asChild variant="secondary">
              <Link href="/">As a link</Link>
            </Button>
            <Button variant="link">Forgot password?</Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="w-10 type-label-md text-fg-tertiary">quiet</span>
            <IconButton aria-label="Close" size="xs"><X /></IconButton>
            <IconButton aria-label="Edit" size="sm" tone="muted"><Pencil /></IconButton>
            <IconButton aria-label="Reload"><RefreshCw /></IconButton>
            <IconButton aria-label="More" tone="muted"><MoreHorizontal /></IconButton>
            <IconButton aria-label="Close" size="lg" shape="round" tone="filled"><X /></IconButton>
            <span className="flex items-center gap-1 rounded-full border border-line-default bg-surface p-1 shadow-soft-sm">
              <IconButton aria-label="Zoom out" shape="round"><Minus /></IconButton>
              <IconButton aria-label="Zoom in" shape="round"><Plus /></IconButton>
              <IconButton aria-label="Fit to screen" shape="round"><Maximize /></IconButton>
            </span>
          </div>
          <CodePanel items={SNIPPETS.buttons} sources={sources} />
        </Section>

        <Section id="forms" title="Forms">
          <div className="grid gap-8 md:grid-cols-2">
            <Field label="Business name" helper="Shown on your site header">
              <Input placeholder="e.g. Rahma Family Clinic" />
            </Field>
            <Field label="Domain" error="This domain is already taken">
              <Input defaultValue="baktianalisa.com" leadingIcon={<Globe />} />
            </Field>
            <Field label="Practice type" helper="Helps us pick the right sections">
              <Select
                options={[
                  { value: "law", label: "Law firm" },
                  { value: "medical", label: "Medical clinic" },
                  { value: "dental", label: "Dental practice" },
                  { value: "lab", label: "Clinical laboratory" },
                  { value: "accounting", label: "Accounting" },
                ]}
              />
            </Field>
            <Field label="Search">
              <Input placeholder="Search your sites" leadingIcon={<Search />} />
            </Field>
            <Field label="About your business" helper="A sentence or two is enough" className="md:col-span-2">
              <Textarea placeholder="A clinical laboratory in Penang serving patients, doctors and companies." />
            </Field>
            <div className="flex flex-col gap-4">
              <Checkbox label="Show opening hours on my site" defaultChecked />
              <Checkbox label="Add a booking page" description="Visitors can pick a date and time" />
              <Checkbox label="Select all pages" checked="indeterminate" />
              <Checkbox label="Disabled option" disabled />
            </div>
            <div className="flex flex-col gap-4">
              <SegmentedControl label="Plan" value={plan} onChange={setPlan} options={[{ value: "free", label: "Free" }, { value: "starter", label: "Starter", tooltip: "Up to 5 pages" }, { value: "business", label: "Business" }]} />
              <SegmentedControl label="Device" size="sm" iconOnly value={device} onChange={setDevice} options={[{ value: "desktop", label: "Desktop", icon: <Monitor /> }, { value: "tablet", label: "Tablet", icon: <Tablet /> }, { value: "mobile", label: "Mobile", icon: <Smartphone /> }]} />
              <span className="rounded-lg bg-subtle p-4">
                <SegmentedControl as="tablist" look="floating" label="Preview mode" value={mode} onChange={setMode} options={[{ value: false, label: "Preview Mode", icon: <Eye /> }, { value: true, label: "Edit Mode", icon: <MousePointerClick /> }]} />
              </span>
            </div>
            <fieldset className="flex flex-col gap-2">
              <RadioCard name="sg-domain" checked={domain === "free"} onChange={() => setDomain("free")} title="bakti-analisa.get.space" description="Free address, ready instantly." />
              <RadioCard name="sg-domain" checked={domain === "own"} onChange={() => setDomain("own")} title="Use a domain I already own" description="We'll show the DNS records to add." />
            </fieldset>
            <div className="flex flex-col gap-4">
              <Switch label="Publish site automatically" defaultChecked />
              <Switch label="Show cookie banner" />
              <Switch label="Disabled" disabled />
            </div>
          </div>
          <CodePanel items={SNIPPETS.forms} sources={sources} />
        </Section>

        <Section id="menus" title="Menus, tabs and dialogs">
          <div className="flex flex-wrap items-start gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">Site actions</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Bakti Analisa</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Pencil /> Edit site
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Globe /> Connect domain
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LayoutTemplate /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem tone="danger">
                  <Trash2 /> Delete site
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog>
              <DialogTrigger asChild>
                <Button leadingIcon={<Globe />}>Connect domain</Button>
              </DialogTrigger>
              <DialogContent
                title="Connect your domain"
                description="Type the domain you already own, or pick a new one while you build."
                footer={
                  <>
                    <DialogClose asChild>
                      <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button>Connect domain</Button>
                    </DialogClose>
                  </>
                }
              >
                <Field label="Domain" helper="Free for the first year">
                  <Input defaultValue="baktianalisa.com" leadingIcon={<Globe />} />
                </Field>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="pages" className="flex flex-col gap-4">
            <TabsList aria-label="Editor panels">
              <TabsTrigger value="pages">Pages</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="pages" className="type-body-md text-fg-secondary">Home, Tests &amp; Packages, For Doctors, About, Contact.</TabsContent>
            <TabsContent value="style" className="type-body-md text-fg-secondary">Clinical Clarity — Plus Jakarta Sans and Inter.</TabsContent>
            <TabsContent value="settings" className="type-body-md text-fg-secondary">Domain, SEO and integrations.</TabsContent>
          </Tabs>
          <CodePanel items={SNIPPETS.menus} sources={sources} />
        </Section>

        <Section id="feedback" title="Feedback">
          <div className="grid gap-4 md:grid-cols-2">
            <Alert tone="info" title="Your brief is ready">Review it, change anything you like, then pick a style.</Alert>
            <Alert tone="success" title="Site published">bakti-analisa.get.space is live.</Alert>
            <Alert tone="warning" title="Domain not connected yet">DNS changes can take up to 24 hours.</Alert>
            {alertOpen && (
              <Alert tone="error" title="Payment failed" onDismiss={() => setAlertOpen(false)}>
                Update your card to keep your site online.
              </Alert>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Alert tone="neutral" size="sm" icon={false} actions={<Button size="sm" variant="secondary" leadingIcon={<Play />}>Resume</Button>}>
              Stopped. Nothing is lost — pick up where I left off.
            </Alert>
            <Alert tone="warning" size="sm" actions={<Button size="sm">Refresh</Button>}>You changed the brief after confirming this.</Alert>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Toast tone="success" message="Changes saved" action={{ label: "Undo", onClick: () => setToast(true) }} />
            <Toast tone="processing" message="Publishing…" />
            <Toast tone="error" message="Couldn’t publish" action={{ label: "Retry", onClick: () => setToast(true) }} />
            {toast && <Badge tone="success">Action clicked</Badge>}
          </div>
          <div className="flex max-w-md flex-col gap-3">
            <ProgressBar value={progress} label="Building your pages…" />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setProgress((p) => Math.max(0, p - 25))}>
                −25
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setProgress((p) => Math.min(100, p + 25))}>
                +25
              </Button>
            </div>
          </div>
          <CodePanel items={SNIPPETS.feedback} sources={sources} />
        </Section>

        <Section id="display" title="Badges, chips, avatars and cards">
          <div className="flex flex-wrap gap-2">
            {(["neutral", "brand", "success", "warning", "error"] as const).map((t) => (
              <Badge key={t} tone={t} className="capitalize">
                {t}
              </Badge>
            ))}
            {(["neutral", "brand", "success", "warning", "error"] as const).map((t) => (
              <Badge key={`${t}-solid`} tone={t} look="solid" className="capitalize">
                {t}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {["Add a booking page", "Show opening hours", "Add a price list"].map((c, i) => (
              <Chip key={c} icon={<Sparkles />} selected={selected === i} onClick={() => setSelected(i)}>
                {c}
              </Chip>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Avatar size="sm" name="Rizqy Ali" />
            <Avatar size="md" name="Bakti Analisa" />
            <Avatar size="lg" name="Kiki" />
            <Avatar size="md" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Clinic starter", desc: "Home, services, doctors and a booking page.", badge: "New" },
              { title: "Law firm", desc: "Practice areas, team profiles and a consultation form.", badge: null },
              { title: "Clinical lab", desc: "Test menu, packages, doctor referrals and results.", badge: "Popular" },
            ].map((c, i) => (
              <Card key={c.title} interactive selected={i === 2} className="flex flex-col">
                <StudsMedia />
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <div className="flex items-center gap-2">
                    <h3 className="flex-1 type-h6">{c.title}</h3>
                    {c.badge && <Badge tone="brand">{c.badge}</Badge>}
                  </div>
                  <p className="type-body-sm text-fg-secondary">{c.desc}</p>
                </div>
                <div className="px-5 pb-5">
                  <Button size="sm" variant="secondary">
                    Use template
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <Accordion type="single" collapsible className="flex max-w-2xl flex-col gap-3">
            <AccordionItem value="hours">
              <AccordionTrigger meta="3 locations">Opening hours</AccordionTrigger>
              <AccordionContent className="type-body-sm text-fg-secondary">Mon–Sat 7:30 am – 6 pm · Sunday 8 am – 1 pm</AccordionContent>
            </AccordionItem>
            <AccordionItem value="prep">
              <AccordionTrigger>Do I need to fast before a blood test?</AccordionTrigger>
              <AccordionContent className="type-body-sm text-fg-secondary">Only for glucose and lipid tests — 8 to 10 hours, water is fine.</AccordionContent>
            </AccordionItem>
          </Accordion>
          <CodePanel items={SNIPPETS.display} sources={sources} />
        </Section>

        <Section id="app" title="App patterns">
          <Stepper
            label="Example steps"
            steps={[
              { title: "Project Brief", caption: "Confirmed", state: "done" },
              { title: "Design & Style", caption: "Awaiting confirmation", state: "current" },
              { title: "Sitemap Plan", caption: "Awaiting confirmation", state: "upcoming" },
            ]}
          />
          <div className="grid gap-8 md:grid-cols-3">
            <nav aria-label="Example navigation" className="flex flex-col gap-0.5">
              <NavItem icon={<Plus />} label="New Website" raised />
              <NavItem icon={<Globe />} label="Websites" active />
              <NavItem icon={<LayoutTemplate />} label="Templates" trailing={<Badge dot={false}>3</Badge>} />
            </nav>
            <div className="flex flex-col gap-3">
              <DetailCard label="Free address" value="bakti-analisa.get.space" trailing={<Badge tone="success">Live</Badge>} />
              <Divider>or with email</Divider>
              <CopyField value="cname.get.space" label="Copy CNAME value" />
            </div>
          </div>
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Website</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell align="right">Visitors · 30 d</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Bakti Analisa Clinical Laboratory</TableCell>
                <TableCell>
                  <Badge tone="success">Live</Badge>
                </TableCell>
                <TableCell align="right">1,284</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Rahma Family Dental</TableCell>
                <TableCell>
                  <Badge>Draft</Badge>
                </TableCell>
                <TableCell align="right">—</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="grid gap-8 md:grid-cols-2">
            <StepList>
              <Step status="done" connector="active">
                <span className="type-body-md text-fg-tertiary">Read your message</span>
              </Step>
              <Step status="done" connector="active">
                <span className="type-body-md text-fg-tertiary">Searched the web</span>
                <span className="type-body-sm text-fg-tertiary">Found 6 results for Bakti Analisa</span>
              </Step>
              <Step status="warning" connector="active">
                <span className="type-body-md text-fg-tertiary">Checked your files</span>
                <span className="type-body-sm text-status-warning-text">One file couldn’t be read</span>
              </Step>
              <Step status="running" current connector="idle">
                <span className="type-body-md shimmer-text">Drafting the brief</span>
              </Step>
              <Step status="pending">
                <span className="type-body-md text-fg-disabled">Planning the pages</span>
              </Step>
            </StepList>
            <div className="flex flex-col gap-4">
              <PromptBox onSubmit={(e) => e.preventDefault()}>
                <span className="flex gap-2">
                  <AttachmentChip icon={<FileText />} name="Price list 2026.pdf" onRemove={() => {}} />
                </span>
                <input aria-label="Message" placeholder="Ask for a change…" className="bg-transparent type-body-lg outline-none placeholder:text-fg-tertiary" />
                <span className="flex items-center gap-2">
                  <PromptAttachButton />
                  <span className="flex-1 type-body-sm text-fg-tertiary">Add photos or documents</span>
                  <PromptSendButton />
                </span>
              </PromptBox>
            </div>
          </div>
          <CodePanel items={SNIPPETS.app} sources={sources} />
        </Section>
      </main>
    </TooltipProvider>
  )
}
