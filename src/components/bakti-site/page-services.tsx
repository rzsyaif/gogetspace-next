"use client"

import { useMemo, useState, type FormEvent } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarCheck,
  Check,
  ClipboardList,
  Heart,
  HelpCircle,
  Phone,
  Search,
  Shield,
  Smile,
  Sparkles,
  Users,
  X,
} from "lucide-react"
import { cn } from "@/lib/cn"
import { PACKAGES, PREP, TESTS, type Treatment } from "@/lib/bakti/content"
import { useSite } from "./site-shell"
import { Card, Eyebrow, FieldLabel, H, PageHero, Price, SButton, SLink, Section, inputClass } from "./ui"

export function ServicesPage() {
  const { href } = useSite()
  const items = [
    {
      Icon: Smile,
      title: "General & Family Dentistry",
      text: "Comprehensive examinations, gentle scaling, tooth-coloured fillings and preventive care.",
      slug: "treatments",
    },
    {
      Icon: Sparkles,
      title: "Orthodontics & Clear Aligners",
      text: "Clear aligners and braces for straighter smiles with digital 3D scans and installment plans.",
      slug: "treatments",
    },
    {
      Icon: Heart,
      title: "New Patients & Nervous Smiles",
      text: "Gentle first visits, anxiety support, and clear step-by-step guides so you always feel at ease.",
      slug: "new-patients",
    },
    {
      Icon: Shield,
      title: "Emergency & Same-Day Relief",
      text: "Prompt relief for toothache, broken teeth and urgent dental care. Reserved slots daily.",
      slug: "for-doctors",
    },
  ]
  return (
    <>
      <PageHero
        eyebrow="Treatments & Services"
        title="Comprehensive dental care, guided by honesty and comfort"
        intro="From routine check-ups and children's dentistry to clear aligners and implants, we take the time to explain your options clearly."
      />
      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {items.map(({ Icon, title, text, slug }) => (
            <Link key={title} href={href(slug)} className="group flex gap-5 rounded-(--s-radius-lg) border border-(--s-line) bg-(--s-card) p-7 hover:border-(--s-primary)">
              <span className="grid size-14 shrink-0 place-items-center rounded-(--s-radius) bg-(--s-tint) text-(--s-primary)">
                <Icon className="size-7" />
              </span>
              <span className="flex flex-col gap-2">
                <H as="h2" className="text-[24px]">{title}</H>
                <span className="text-[15px] leading-relaxed text-(--s-muted)">{text}</span>
                <span className="mt-2 inline-flex items-center gap-1.5 font-semibold text-(--s-primary)">
                  View details <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </Section>
      <Section tone="tint">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { Icon: Heart, title: "Comfort-first approach", text: "Topical numbing gel, gentle dentists and pause signals whenever you need a break." },
            { Icon: ClipboardList, title: "Clear treatment estimates", text: "Honest 'from' prices with itemised fees explained before any procedure begins." },
            { Icon: Users, title: "Insurance & panels accepted", text: "Direct panel billing and detailed receipts for tax relief and claim reimbursement." },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="flex flex-col gap-3">
              <Icon className="size-7 text-(--s-primary)" />
              <H as="h3" className="text-[20px]">{title}</H>
              <p className="text-[15px] text-(--s-muted)">{text}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}

const CATEGORIES = ["All", "General", "Cosmetic", "Orthodontics", "Implants & Restorative", "Pediatric", "Emergency"] as const

export function TestsPage() {
  const { book } = useSite()
  const [q, setQ] = useState("")
  const [cat, setCat] = useState<string>("All")
  const results = useMemo(
    () =>
      TESTS.filter(
        (t) =>
          (cat === "All" || t.category === cat) &&
          (t.name + " " + t.description).toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [q, cat],
  )
  return (
    <>
      <PageHero
        eyebrow="Treatments & Prices"
        title="Clear prices and honest estimates"
        intro="We show transparent from-prices for routine treatments and provide written estimates after examination for complex procedures."
      />

      <Section>
        <div className="mb-8 flex flex-col gap-3">
          <Eyebrow>Routine preventive packages</Eyebrow>
          <H className="text-[28px] sm:text-[36px]">Care bundles</H>
          <p className="text-[14px] text-(--s-muted)">Notice: Final fees are confirmed after direct clinical examination. No surprise costs.</p>
        </div>
        <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-[15px]">
            <thead>
              <tr className="text-[13px] text-(--s-muted)">
                <th className="border-b border-(--s-line) py-3 pr-4 font-semibold">Package</th>
                <th className="border-b border-(--s-line) py-3 pr-4 font-semibold">Recommended for</th>
                <th className="border-b border-(--s-line) py-3 pr-4 font-semibold">Includes</th>
                <th className="border-b border-(--s-line) py-3 pr-4 text-right font-semibold">Price</th>
                <th className="border-b border-(--s-line) py-3" />
              </tr>
            </thead>
            <tbody>
              {PACKAGES.map((p) => (
                <tr key={p.id} className={cn(p.featured && "bg-(--s-tint)")}>
                  <td className="border-b border-(--s-line) py-4 pr-4 pl-2 align-top">
                    <span className="font-semibold">{p.name}</span>
                    {p.featured && <span className="ml-2 rounded-full bg-(--s-primary) px-2 py-0.5 text-[11px] font-semibold text-(--s-on-primary) whitespace-nowrap">Popular</span>}
                    <span className="block text-[13px] text-(--s-muted)">{p.tests} items</span>
                  </td>
                  <td className="border-b border-(--s-line) py-4 pr-4 align-top text-(--s-muted)">{p.for}</td>
                  <td className="border-b border-(--s-line) py-4 pr-4 align-top text-[14px]">{p.highlights.join(" · ")}</td>
                  <td className="border-b border-(--s-line) py-4 pr-4 text-right align-top text-[18px] font-bold">
                    <span className="text-[12px] font-normal text-(--s-muted)">from </span>
                    <Price value={p.price} />
                  </td>
                  <td className="border-b border-(--s-line) py-4 pr-2 text-right align-top">
                    <SButton tone={p.featured ? "primary" : "secondary"} onClick={() => book(p.id)}>Book visit</SButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section tone="tint">
        <div className="mb-6 flex flex-col gap-3">
          <Eyebrow>Individual treatments</Eyebrow>
          <H className="text-[28px] sm:text-[36px]">Treatment directory</H>
        </div>
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search treatments</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-(--s-muted)" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, e.g. cleaning, filling, aligners, toothache" className={cn(inputClass, "pl-12")} />
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" onClick={() => setCat(c)} aria-pressed={cat === c} className={cn("h-10 rounded-full border px-4 text-[14px] font-medium", cat === c ? "border-(--s-primary) bg-(--s-primary) text-(--s-on-primary)" : "border-(--s-line) bg-(--s-card)")}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <p className="mb-3 text-[14px] text-(--s-muted)" aria-live="polite">
          {results.length} {results.length === 1 ? "treatment" : "treatments"}
        </p>
        {results.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-12 text-center">
            <Search className="size-8 text-(--s-muted)" />
            <p className="text-[17px] font-semibold">No treatments match “{q}”</p>
            <p className="text-[15px] text-(--s-muted)">We provide full general and specialist dental services — ask our team on WhatsApp.</p>
            <SButton tone="secondary" onClick={() => { setQ(""); setCat("All") }}><X /> Clear search</SButton>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {results.map((t) => <TreatmentRow key={t.id} t={t} onBook={() => book(t.id)} />)}
          </ul>
        )}
      </Section>
    </>
  )
}

function TreatmentRow({ t, onBook }: { t: Treatment; onBook: () => void }) {
  return (
    <li className="flex flex-col gap-3 rounded-(--s-radius) border border-(--s-line) bg-(--s-card) p-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[17px] font-semibold">{t.name}</span>
          <span className="rounded-full bg-(--s-tint) px-2 py-0.5 text-[12px] font-medium">{t.category}</span>
        </div>
        <p className="text-[14px] text-(--s-muted)">{t.description}</p>
        {t.comfortNote && <p className="text-[13px] text-emerald-800">✨ Comfort note: {t.comfortNote}</p>}
        <p className="text-[13px] text-(--s-muted)">{t.duration} · {t.turnaround}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <span className="text-[12px] text-(--s-muted)">from </span>
          <Price value={t.price} className="text-[20px] font-bold" />
        </div>
        <SButton tone="secondary" onClick={onBook}>Book</SButton>
      </div>
    </li>
  )
}

export function DoctorsPage() {
  return (
    <>
      <PageHero
        eyebrow="Emergency & Urgent Dental Care"
        title="Fast toothache relief and same-day dental care"
        intro="Severe pain, a chipped tooth or broken filling? We reserve same-day emergency slots every weekday."
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <div className="rounded-(--s-radius-lg) border border-amber-200 bg-amber-50 p-6">
              <span className="flex items-center gap-2 text-[16px] font-semibold text-amber-900">
                <AlertTriangle className="size-5 text-amber-700" /> Urgent triage advice
              </span>
              <p className="mt-2 text-[14px] leading-relaxed text-amber-950">
                If you have severe facial swelling extending to your eye or neck, difficulty swallowing or breathing, or uncontrolled bleeding, please visit the emergency department at your nearest hospital or call 999.
              </p>
            </div>
            <H as="h2" className="text-[26px]">What we treat on the same day</H>
            <ul className="flex flex-col gap-3 text-[15px] text-(--s-muted)">
              <li className="flex items-center gap-2.5"><Check className="size-5 text-(--s-primary)" /> Severe, throbbing toothache relief</li>
              <li className="flex items-center gap-2.5"><Check className="size-5 text-(--s-primary)" /> Chipped, cracked, or knocked-out teeth</li>
              <li className="flex items-center gap-2.5"><Check className="size-5 text-(--s-primary)" /> Lost fillings, loose crowns or broken dentures</li>
              <li className="flex items-center gap-2.5"><Check className="size-5 text-(--s-primary)" /> Wisdom tooth inflammation and pericoronitis</li>
            </ul>
          </div>
          <Card className="flex flex-col gap-4 p-8">
            <H as="h3" className="text-[22px]">Request an emergency or consultation slot</H>
            <p className="text-[14px] text-(--s-muted)">Our triage team monitors requests and will call or WhatsApp you within 15 minutes.</p>
            <InquiryForm
              fields={[
                { label: "Your name", placeholder: "Full name" },
                { label: "WhatsApp phone number", placeholder: "012-345 6789" },
                { label: "Describe your concern", textarea: true, placeholder: "e.g. sharp toothache lower right side since yesterday" },
              ]}
              cta="Request emergency triage"
              done="We've received your emergency request. Our duty team will call or WhatsApp you shortly."
            />
          </Card>
        </div>
      </Section>
    </>
  )
}

export function CorporatePage() {
  return (
    <>
      <PageHero
        eyebrow="Corporate & Family Plans"
        title="Dental wellness benefits for teams and families"
        intro="Preventive dental screening and discounted corporate rates to keep your staff healthy, smiling and productive."
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <H as="h2" className="text-[26px]">Why offer dental wellness to your employees?</H>
            <p className="text-[16px] leading-relaxed text-(--s-muted)">
              Untreated dental pain is one of the leading causes of unplanned medical leave. Regular check-ups and cleanings catch small cavities before they turn into emergency root canals.
            </p>
            <ul className="mt-2 flex flex-col gap-3 text-[15px] text-(--s-muted)">
              <li className="flex items-center gap-2"><Check className="size-5 text-(--s-primary)" /> Direct billing with major HR and insurance portals</li>
              <li className="flex items-center gap-2"><Check className="size-5 text-(--s-primary)" /> Flexible packages for small teams (from 10 employees) to MNCs</li>
              <li className="flex items-center gap-2"><Check className="size-5 text-(--s-primary)" /> 0% instalment support for employee orthodontic treatments</li>
            </ul>
          </div>
          <Card className="flex flex-col gap-4 p-8">
            <H as="h3" className="text-[22px]">Inquire about a corporate plan</H>
            <InquiryForm
              fields={[
                { label: "Company name", placeholder: "e.g. Acme Sdn. Bhd." },
                { label: "Contact person", placeholder: "HR Manager name" },
                { label: "Work email", type: "email", placeholder: "hr@company.com" },
                { label: "Estimated team size", placeholder: "e.g. 50 employees" },
              ]}
              cta="Request corporate proposal"
              done="Thank you! Our corporate relations lead will email you a proposal within 1 business day."
            />
          </Card>
        </div>
      </Section>
    </>
  )
}

export function PreparePage() {
  const { book } = useSite()
  return (
    <>
      <PageHero
        eyebrow="New Patients Guide"
        title="Everything you need to know before your first visit"
        intro="We want your visit to feel as comfortable and relaxed as possible. Here is what to expect and what to bring."
      />
      <Section>
        <div className="grid gap-8 md:grid-cols-2">
          {PREP.map((section) => (
            <Card key={section.title} className="flex flex-col gap-4 p-7">
              <H as="h3" className="text-[20px]">{section.title}</H>
              <ul className="flex flex-col gap-2.5 text-[15px] text-(--s-muted)">
                {section.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <Check className="mt-1 size-4 shrink-0 text-(--s-primary)" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-(--s-radius-lg) bg-(--s-tint) p-8 text-center sm:flex-row sm:text-left">
          <div>
            <H as="h3" className="text-[22px]">Ready for a friendly check-up?</H>
            <p className="text-[15px] text-(--s-muted)">Book online in 60 seconds with instant confirmation.</p>
          </div>
          <SButton size="lg" onClick={() => book()}>
            <CalendarCheck /> Book an appointment
          </SButton>
        </div>
      </Section>
    </>
  )
}

function InquiryForm({ fields, cta, done }: { fields: { label: string; type?: string; textarea?: boolean; placeholder?: string }[]; cta: string; done: string }) {
  const [sent, setSent] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSent(true)
  }
  if (sent)
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-(--s-tint) text-(--s-primary)"><Check className="size-7" /></span>
        <p className="text-[17px] font-semibold">Thank you!</p>
        <p className="max-w-md text-[14px] text-(--s-muted)">{done}</p>
      </Card>
    )
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {fields.map((f) => (
        <FieldLabel key={f.label} label={f.label}>
          {f.textarea ? (
            <textarea rows={3} required placeholder={f.placeholder} className={inputClass} />
          ) : (
            <input type={f.type ?? "text"} required placeholder={f.placeholder} className={inputClass} />
          )}
        </FieldLabel>
      ))}
      <SButton type="submit" size="lg" className="mt-2 w-full">{cta}</SButton>
    </form>
  )
}
