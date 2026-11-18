"use client"

import { Check, ChevronLeft, ImageIcon, Lock, MessageCircle, Phone, Star } from "lucide-react"
import { cn } from "@/lib/cn"
import type { Showcase } from "@/lib/playbooks/module-showcase"

/**
 * A picture of a module, drawn rather than photographed: what customers see on the site (in a phone), and what
 * the owner sees in the module's own app (in a window). One layout per kind, worded for the module.
 */
export function ModulePreview({ sc, view }: { sc: Showcase; view: "customer" | "owner" }) {
  return view === "customer" ? <Phone_ sc={sc} /> : <AppWindow sc={sc} />
}

/* ---------------- what customers see ---------------- */

function Phone_({ sc }: { sc: Showcase }) {
  const l = sc.labels
  return (
    <div aria-hidden className="mx-auto flex h-[380px] w-[230px] flex-col overflow-hidden rounded-[32px] border-[6px] border-neutral-900 bg-white shadow-xl">
      <div className="flex h-7 shrink-0 items-center justify-center">
        <span className="h-1.5 w-14 rounded-full bg-neutral-900" />
      </div>
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-neutral-200 px-3">
        <span className="size-5 rounded-md bg-blue-500" />
        <span className="h-2 w-16 rounded-full bg-neutral-300" />
        <span className="ml-auto h-2 w-4 rounded-full bg-neutral-300" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3.5">
        <div className="flex flex-col gap-1">
          <p className="text-[15px] leading-tight font-semibold text-neutral-900">{l.site}</p>
          {l.siteNote && <p className="text-[11px] text-neutral-500">{l.siteNote}</p>}
        </div>
        <SiteBody sc={sc} />
        <span className="mt-auto grid h-9 shrink-0 place-items-center rounded-lg bg-blue-500 text-[12px] font-semibold text-white">{l.action}</span>
      </div>
    </div>
  )
}

function SiteBody({ sc }: { sc: Showcase }) {
  const l = sc.labels
  switch (sc.kind) {
    case "booking":
      return (
        <div className="grid grid-cols-2 gap-1.5">
          {l.items.map((t, i) => (
            <span key={t} className={cn("grid h-8 place-items-center rounded-md border text-[11px]", i === 2 ? "border-blue-500 bg-blue-500 font-semibold text-white" : "border-neutral-200 text-neutral-700")}>
              {t}
            </span>
          ))}
        </div>
      )
    case "form":
      return (
        <div className="flex flex-col gap-2">
          {l.items.map((f) => (
            <div key={f} className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-neutral-600">{f}</span>
              <span className="h-7 rounded-md border border-neutral-200 bg-neutral-50" />
            </div>
          ))}
          <span className="flex items-center gap-1 text-[10px] text-neutral-500">
            <Lock className="size-3" /> Kept private
          </span>
        </div>
      )
    case "contacts":
      return (
        <div className="flex flex-col gap-2 rounded-xl bg-[#E7F7EE] p-2.5">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#128C4B]">
            <MessageCircle className="size-3.5" /> WhatsApp
          </span>
          {l.items.map((m) => (
            <p key={m} className="rounded-lg rounded-tl-none bg-white p-2 text-[11px] leading-snug text-neutral-800 shadow-sm">
              {m}
            </p>
          ))}
        </div>
      )
    case "payments":
      return (
        <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-3">
          <span className="flex items-baseline justify-between text-[11px] text-neutral-600">
            {l.items[0]} <span className="text-[16px] font-semibold text-neutral-900">{l.items[1]}</span>
          </span>
          <span className="h-8 rounded-md border border-neutral-200 bg-neutral-50 px-2 text-[10px] leading-8 text-neutral-400">Card number</span>
          <div className="flex gap-1.5">
            {["FPX", "Card", "E-wallet"].map((x, i) => (
              <span key={x} className={cn("flex-1 rounded-md border py-1 text-center text-[10px]", i === 0 ? "border-blue-500 text-blue-600" : "border-neutral-200 text-neutral-600")}>
                {x}
              </span>
            ))}
          </div>
        </div>
      )
    case "reviews":
      return (
        <div className="flex flex-col gap-2">
          <span className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="size-3.5" style={{ fill: "#F5A524", color: "#F5A524" }} />
            ))}
          </span>
          {l.items.map((r) => (
            <p key={r} className="rounded-lg border border-neutral-200 p-2 text-[11px] leading-snug text-neutral-700 italic">
              {r}
            </p>
          ))}
        </div>
      )
    case "gallery":
      return (
        <div className="flex flex-col gap-2">
          {l.items.slice(0, 2).map((t) => (
            <div key={t} className="flex flex-col gap-1">
              <div className="grid grid-cols-2 gap-1">
                {["Before", "After"].map((x) => (
                  <span key={x} className="relative grid h-14 place-items-center rounded-md bg-neutral-100">
                    <ImageIcon className="size-4 text-neutral-400" />
                    <span className="absolute bottom-1 left-1 rounded bg-white/80 px-1 text-[9px] text-neutral-600">{x}</span>
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-neutral-500">{t}</span>
            </div>
          ))}
        </div>
      )
    case "page":
      return (
        <div className="flex flex-col gap-2">
          {l.items.map((x, i) => (
            <span key={x} className={cn("flex h-9 items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold", i === 0 ? "bg-neutral-900 text-white" : "border border-neutral-200 text-neutral-800")}>
              {i === 0 ? <Phone className="size-3.5" /> : <MessageCircle className="size-3.5" />} {x}
            </span>
          ))}
          <p className="rounded-md bg-yellow-50 p-2 text-[10px] leading-snug text-yellow-900">If you are in immediate danger, call your local emergency number.</p>
        </div>
      )
    case "articles":
      return (
        <div className="flex flex-col gap-2">
          {l.items.map((a) => (
            <div key={a} className="flex gap-2 rounded-lg border border-neutral-200 p-2">
              <span className="size-9 shrink-0 rounded-md bg-neutral-100" />
              <span className="text-[11px] leading-snug font-medium text-neutral-800">{a}</span>
            </div>
          ))}
        </div>
      )
    case "locations":
      return (
        <div className="flex flex-col gap-2">
          {l.items.map((b, i) => (
            <span key={b} className={cn("flex items-center gap-2 rounded-lg border p-2 text-[11px]", i === 0 ? "border-blue-500 bg-blue-50 text-neutral-900" : "border-neutral-200 text-neutral-700")}>
              <span className="size-6 shrink-0 rounded-full bg-neutral-200" />
              {b}
            </span>
          ))}
        </div>
      )
  }
}

/* ---------------- what the owner sees ---------------- */

function AppWindow({ sc }: { sc: Showcase }) {
  const l = sc.labels
  return (
    <div aria-hidden className="mx-auto flex h-[380px] w-full max-w-[420px] flex-col overflow-hidden rounded-xl border border-neutral-300 bg-white shadow-xl">
      <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-neutral-200 bg-neutral-50 px-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-2.5 rounded-full bg-neutral-300" />
        ))}
        <span className="ml-3 text-[11px] font-medium text-neutral-600">{l.app}</span>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-12 shrink-0 flex-col items-center gap-3 border-r border-neutral-200 py-3">
          <ChevronLeft className="size-4 text-neutral-400" />
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn("size-6 rounded-md", i === 0 ? "bg-blue-100" : "bg-neutral-100")} />
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[14px] font-semibold text-neutral-900">{l.app.split(" · ")[0]}</span>
            <span className="rounded-md bg-blue-500 px-2 py-1 text-[10px] font-semibold text-white">+ New</span>
          </div>
          {sc.kind === "booking" && (
            <div className="grid grid-cols-5 gap-1">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => (
                <span key={d} className={cn("rounded-md py-1 text-center text-[10px]", i === 1 ? "bg-blue-500 font-semibold text-white" : "bg-neutral-100 text-neutral-600")}>
                  {d}
                </span>
              ))}
            </div>
          )}
          <ul className="flex flex-col divide-y divide-neutral-100 rounded-lg border border-neutral-200">
            {l.rows.map(([name, detail, status]) => (
              <li key={name + detail} className="flex items-center gap-2 px-3 py-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-600">{name.replace(/[^A-Z]/g, "").slice(0, 2) || name[0]}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[11px] font-semibold text-neutral-900">{name}</span>
                  <span className="truncate text-[10px] text-neutral-500">{detail}</span>
                </span>
                <StatusPill status={status} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const good = /confirmed|showing|paid|accepted|published|on|ok|active|listed|replied|taking/i.test(status)
  const fresh = /new|due|needs|conflict|waiting|follow|review/i.test(status) && !good
  return (
    <span className={cn("flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", good ? "bg-green-50 text-green-700" : fresh ? "bg-yellow-50 text-yellow-800" : "bg-neutral-100 text-neutral-600")}>
      {good && <Check className="size-3" />}
      {status}
    </span>
  )
}
