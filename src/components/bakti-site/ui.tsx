import type { ComponentProps, CSSProperties, ReactNode } from "react"
import Link from "next/link"
import { cn } from "@/lib/cn"
import { FONT_STACK } from "./site-fonts"
import type { SiteTheme } from "@/lib/bakti/themes"

/** CSS variables the generated site is styled with — every page reads only these. */
export function themeVars(t: SiteTheme): CSSProperties {
  const [primary, soft, accent, ink, paper] = t.palette
  return {
    "--s-primary": primary,
    "--s-soft": soft,
    "--s-accent": accent,
    "--s-ink": ink,
    "--s-paper": paper,
    "--s-on-primary": t.onPrimary,
    "--s-muted": `color-mix(in oklab, ${ink} 68%, ${paper})`,
    "--s-line": `color-mix(in oklab, ${ink} 12%, ${paper})`,
    "--s-tint": `color-mix(in oklab, ${soft} 28%, ${paper})`,
    "--s-card": `color-mix(in oklab, white 70%, ${paper})`,
    "--s-primary-hover": `color-mix(in oklab, ${primary} 86%, black)`,
    "--s-radius": `${t.radius}px`,
    "--s-radius-lg": `${Math.min(t.radius * 1.6, 40)}px`,
    "--s-btn-radius": `${t.buttonRadius}px`,
    "--s-heading": FONT_STACK[t.heading],
    "--s-body": FONT_STACK[t.body],
    "--s-hw": String(t.headingWeight),
  } as CSSProperties
}

export const container = "mx-auto w-full max-w-[1180px] px-5 sm:px-8"

export function H({ as: Tag = "h2", className, children }: { as?: "h1" | "h2" | "h3" | "h4"; className?: string; children: ReactNode }) {
  return (
    <Tag className={cn("text-balance text-(--s-ink)", className)} style={{ fontFamily: "var(--s-heading)", fontWeight: "var(--s-hw)" as unknown as number }}>
      {children}
    </Tag>
  )
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[13px] font-semibold tracking-[0.08em] text-(--s-primary) uppercase", className)}>{children}</p>
}

type BtnTone = "primary" | "secondary" | "ghost" | "light"
const btn = (tone: BtnTone, size: "md" | "lg" = "md") =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-(--s-btn-radius) font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--s-primary) disabled:cursor-not-allowed disabled:opacity-45 [&_svg]:size-[18px] [&_svg]:shrink-0",
    size === "lg" ? "h-13 px-6 text-[16px]" : "h-11 px-5 text-[15px]",
    tone === "primary" && "bg-(--s-primary) text-(--s-on-primary) hover:bg-(--s-primary-hover)",
    tone === "secondary" && "border border-(--s-line) bg-(--s-card) text-(--s-ink) hover:border-(--s-primary)",
    tone === "ghost" && "text-(--s-primary) hover:bg-(--s-tint)",
    tone === "light" && "bg-white text-(--s-ink) hover:bg-white/90",
  )

export function SButton({ tone = "primary", size, className, ...props }: ComponentProps<"button"> & { tone?: BtnTone; size?: "md" | "lg" }) {
  return <button type="button" className={cn(btn(tone, size), className)} {...props} />
}

export function SLink({ tone = "primary", size, className, ...props }: ComponentProps<typeof Link> & { tone?: BtnTone; size?: "md" | "lg" }) {
  return <Link className={cn(btn(tone, size), className)} {...props} />
}

export function Section({ className, children, id, tone }: { className?: string; children: ReactNode; id?: string; tone?: "tint" | "ink" | "card" }) {
  return (
    <section
      id={id}
      className={cn(
        "py-16 sm:py-24",
        tone === "tint" && "bg-(--s-tint)",
        tone === "ink" && "bg-(--s-ink) text-white",
        tone === "card" && "bg-(--s-card)",
        className,
      )}
    >
      <div className={container}>{children}</div>
    </section>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-(--s-radius-lg) border border-(--s-line) bg-(--s-card) p-6", className)}>{children}</div>
}

export function Price({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("tabular-nums", className)}>
      <span className="mr-0.5 text-[0.7em] font-semibold opacity-70">RM</span>
      {value}
    </span>
  )
}

export function PageHero({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children?: ReactNode }) {
  return (
    <section className="border-b border-(--s-line) bg-(--s-tint) py-14 sm:py-20">
      <div className={cn(container, "flex flex-col gap-4")}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <H as="h1" className="max-w-3xl text-[36px] leading-[1.1] sm:text-[52px]">
          {title}
        </H>
        <p className="max-w-2xl text-[18px] leading-relaxed text-(--s-muted)">{intro}</p>
        {children}
      </div>
    </section>
  )
}

export const inputClass =
  "h-12 w-full rounded-(--s-radius) border border-(--s-line) bg-white px-4 text-[15px] text-(--s-ink) outline-none placeholder:text-(--s-muted) focus:border-(--s-primary) focus:ring-3 focus:ring-(--s-soft)/40"

export function FieldLabel({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-[14px] font-medium text-(--s-ink)", className)}>
      {label}
      {children}
    </label>
  )
}
