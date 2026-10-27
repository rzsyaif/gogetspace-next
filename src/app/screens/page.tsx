import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, House, LayoutDashboard, MessagesSquare, Palette, Sparkles } from "lucide-react"
import { Badge, Card, Logo } from "@/components/ui"
import { ThemeToggle } from "@/components/theme"

export const metadata: Metadata = { title: "Prototype screens" }

const SCREENS = [
  { href: "/", title: "Homepage", desc: "Marketing site with the AI prompt, Pixel Blocks and feature cards.", Icon: House, ready: true },
  { href: "/styleguide", title: "Style guide", desc: "Baseplate tokens and components, in light and dark.", Icon: Palette, ready: true },
  { href: "#", title: "Generating", desc: "Prompt → brief → style options → sitemap → building.", Icon: Sparkles, ready: false },
  { href: "#", title: "Editor", desc: "Chat with the agent beside a live preview of the site.", Icon: MessagesSquare, ready: false },
  { href: "#", title: "Dashboard", desc: "Sites, domains, billing and account settings.", Icon: LayoutDashboard, ready: false },
]

export default function Screens() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10 sm:px-8 sm:py-16">
      <div className="flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </div>
      <div className="flex flex-col gap-3">
        <Badge tone="brand" className="self-start">
          UI prototype
        </Badge>
        <h1 className="type-h1">GoGetSpace app</h1>
        <p className="max-w-2xl type-body-lg text-fg-secondary">
          Front-end prototype of the builder. Everything here runs on sample data and a scripted agent.
        </p>
      </div>
      <ul className="grid gap-6 sm:grid-cols-2">
        {SCREENS.map(({ href, title, desc, Icon, ready }) => (
          <li key={title}>
            {ready ? (
              <Link href={href} className="block rounded-lg focus-visible:outline-none focus-visible:focus-ring">
                <ScreenCard title={title} desc={desc} Icon={Icon} ready />
              </Link>
            ) : (
              <ScreenCard title={title} desc={desc} Icon={Icon} />
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}

function ScreenCard({ title, desc, Icon, ready }: { title: string; desc: string; Icon: typeof Palette; ready?: boolean }) {
  return (
    <Card interactive={ready} className="flex h-full items-start gap-4 p-6">
      <span className="grid size-11 shrink-0 place-items-center rounded-md bg-accent-blue-subtle text-fg-link">
        <Icon aria-hidden className="size-5" />
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="type-h5">{title}</h2>
          {!ready && <Badge>Next</Badge>}
        </div>
        <p className="type-body-sm text-fg-secondary">{desc}</p>
      </div>
      {ready && <ArrowRight aria-hidden className="mt-1 size-5 text-fg-tertiary" />}
    </Card>
  )
}
