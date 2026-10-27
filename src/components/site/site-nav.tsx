"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown, Globe, Menu, Server, Sparkles, X } from "lucide-react"
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Logo } from "@/components/ui"
import { cn } from "@/lib/cn"
import { focusHeroPrompt } from "./prompt-events"

const SOLUTIONS = [
  { title: "AI Website Builder", desc: "Describe your business, get a site", Icon: Sparkles },
  { title: "Managed Hosting", desc: "Fast, secure and always on", Icon: Server },
  { title: "Domains", desc: "Find, buy and connect a domain", Icon: Globe },
]

const navItem =
  "inline-flex items-center gap-1 rounded-sm px-3 py-1.5 type-label-md text-fg-secondary transition-colors hover:bg-action-ghost-hover hover:text-fg-primary focus-visible:outline-none focus-visible:focus-ring"

/** Marketing top nav: transparent at the top, frosted once the page scrolls; drawer below 810px. */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // close the drawer when growing past the phone breakpoint
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 810px)")
    const onChange = () => mq.matches && setOpen(false)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-[background-color,backdrop-filter] duration-200",
        scrolled || open ? "bg-canvas/80 backdrop-blur-md" : "bg-transparent",
      )}
    >
      <nav aria-label="Main" className="mx-auto flex max-w-[1264px] flex-col gap-6 px-5 py-6 min-[810px]:flex-row min-[810px]:items-center min-[810px]:gap-8 min-[810px]:px-8">
        <div className="flex flex-1 items-center justify-between">
          <Link href="/" className="rounded-md focus-visible:outline-none focus-visible:focus-ring" onClick={() => setOpen(false)}>
            <Logo />
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((o) => !o)}
            className="grid size-10 place-items-center rounded-md bg-subtle text-fg-primary focus-visible:outline-none focus-visible:focus-ring min-[810px]:hidden"
          >
            {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
          </button>
        </div>

        {/* desktop */}
        <ul className="hidden items-center gap-1 min-[810px]:flex">
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(navItem, "data-[state=open]:bg-action-ghost-hover [&[data-state=open]>svg]:rotate-180")}>
                Solutions
                <ChevronDown aria-hidden className="size-4 transition-transform" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                {SOLUTIONS.map(({ title, desc, Icon }) => (
                  <DropdownMenuItem key={title} className="items-start gap-3 py-2.5">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-accent-blue-subtle text-fg-link">
                      <Icon aria-hidden className="size-4" />
                    </span>
                    <span className="flex flex-col">
                      <span className="type-label-md text-fg-primary">{title}</span>
                      <span className="type-body-sm text-fg-secondary">{desc}</span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
          <li>
            <a href="#pricing" className={navItem}>Pricing</a>
          </li>
          <li>
            <a href="#" className={navItem}>About Us</a>
          </li>
        </ul>
        <div className="hidden flex-1 items-center justify-end gap-2 min-[810px]:flex">
          <Button variant="secondary" size="sm">Log in</Button>
          <Button size="sm" onClick={focusHeroPrompt}>Start building</Button>
        </div>

        {/* phone drawer */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="site-menu"
              key="drawer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0 }}
              className="-mx-1 overflow-hidden px-1 min-[810px]:hidden"
            >
              <div className="flex flex-col gap-6 pb-2">
                <ul className="flex flex-col gap-1">
                  <li className="px-3 pt-1.5 type-label-sm text-fg-tertiary">SOLUTIONS</li>
                  {SOLUTIONS.map(({ title, Icon }) => (
                    <li key={title}>
                      <a href="#" className={cn(navItem, "w-full gap-3")} onClick={() => setOpen(false)}>
                        <Icon aria-hidden className="size-4 text-fg-link" />
                        {title}
                      </a>
                    </li>
                  ))}
                  <li>
                    <a href="#pricing" className={cn(navItem, "w-full")} onClick={() => setOpen(false)}>Pricing</a>
                  </li>
                  <li>
                    <a href="#" className={cn(navItem, "w-full")} onClick={() => setOpen(false)}>About Us</a>
                  </li>
                </ul>
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" className="w-full">Log in</Button>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setOpen(false)
                      focusHeroPrompt()
                    }}
                  >
                    Start building
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}
