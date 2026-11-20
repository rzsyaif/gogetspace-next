"use client"

import { useRef, useState, type ReactNode } from "react"
import { motion } from "motion/react"
import { ArrowLeft, Check, ChevronDown, CircleHelp, FileSpreadsheet, Pencil, Plus, Sparkles, Upload, X } from "lucide-react"
import { Badge, Button, Input, RadioDot, Tooltip } from "@gogetspace/baseplate"
import { cn } from "@gogetspace/baseplate/cn"
import type { Msg } from "@/lib/generation/state"
import { goalChips, playbookOf, questionProgress, sharpenView, type PriceList, type TeamList, type TeamMember } from "@/lib/playbooks/engine"
import { jurisdictionOf } from "@/lib/playbooks/lawyer"
import { useGen } from "./gen-provider"

type QuestionMsg = Extract<Msg, { type: "pb-question" }>
type GateMsg = Extract<Msg, { type: "pb-gate" }>

const OTHER = "__other"
const DECIDE = "decide"

/* ---------------- shell (Figma "Question popover", 125:982) ---------------- */

export function Shell({
  title,
  help,
  description,
  counter,
  question,
  children,
  footer,
  compact,
}: {
  title: string
  help?: string
  description: string
  counter?: string
  question: string
  children: ReactNode
  footer: ReactNode
  compact?: boolean
}) {
  return (
    <section aria-label={title} data-question-open className={cn("flex flex-col gap-6 rounded-[24px] border border-line-default bg-surface p-4 shadow-[0_2px_0_0_var(--color-shadow-block)] sm:p-6", !compact && "sm:mr-20")}>
      <div className="flex items-start gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="flex items-center gap-2 type-h5 text-fg-primary">
            {title}
            {help && (
              <Tooltip content={help}>
                <button type="button" aria-label="Why these questions?" className="rounded-full text-fg-tertiary hover:text-fg-secondary focus-visible:outline-none focus-visible:focus-ring">
                  <CircleHelp className="size-5" />
                </button>
              </Tooltip>
            )}
          </h3>
          <p className="type-body-sm text-fg-secondary">{description}</p>
        </div>
        {counter && (
          <p className="shrink-0 type-h5 text-fg-brand tabular-nums" aria-label={`Question ${counter.replace(" / ", " of ")}`}>
            {counter}
          </p>
        )}
      </div>
      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-2 type-body-md text-fg-primary">{question}</legend>
        {children}
      </fieldset>
      {footer}
    </section>
  )
}

/** the bordered list of answers; the chosen row is tinted and can show more under it */
export function Options({ children, multi }: { children: ReactNode; multi?: boolean }) {
  return (
    <div role={multi ? "group" : "radiogroup"} className="flex flex-col divide-y divide-line-default overflow-hidden rounded-[16px] border border-line-default">
      {children}
    </div>
  )
}

export function Row({
  checked,
  multi,
  label,
  description,
  onSelect,
  trailing,
  children,
}: {
  checked: boolean
  multi?: boolean
  label: ReactNode
  description?: ReactNode
  onSelect: () => void
  trailing?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-4 p-4 transition-colors", checked ? "bg-status-info-bg" : "hover:bg-subtle")}>
      <div className="flex items-center gap-3">
        <button type="button" role={multi ? "checkbox" : "radio"} aria-checked={checked} onClick={onSelect} className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none [&:focus-visible>span:first-child]:focus-ring">
          {multi ? (
            <span aria-hidden className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-sm border-2 transition-colors", checked ? "border-transparent bg-action-primary text-fg-on-action" : "border-line-strong bg-surface")}>
              {checked && <Check className="size-3.5" strokeWidth={3} />}
            </span>
          ) : (
            <RadioDot checked={checked} className="mt-0.5" />
          )}
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="type-body-md text-fg-primary">{label}</span>
            {description && <span className="type-body-sm text-fg-secondary">{description}</span>}
          </span>
        </button>
        {trailing}
      </div>
      {checked && children && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="pl-8">
          {children}
        </motion.div>
      )}
    </div>
  )
}

/* ---------------- the series of questions ---------------- */

/**
 * One question at a time, like a short form: pick an answer (or write your own, or let the agent decide), then
 * Next. Back reopens the previous question; "Skip these questions" lets the agent decide the rest.
 */
export function QuestionCard({ m, compact }: { m: QuestionMsg; compact?: boolean }) {
  const { s, dispatch } = useGen()
  const pb = s.pb!
  const book = playbookOf(pb)
  const q = book.questions.find((x) => x.id === m.qid && (!m.variant || x.variant === m.variant))!
  const goals = m.slot === "goals"
  // practice areas: several answers, up to q.multi
  const multi = !goals && !!q.multi
  const several = goals && pb.candidates?.kind === "several"
  // after the build, what the site was built with is already picked: keep it with Next, or change it
  const guessed = s.phase === "create" ? (goals ? pb.goals : (pb.answers[m.slot as keyof typeof pb.answers]?.value.split(",") ?? [])) : []
  const [picked, setPicked] = useState<string[]>(() =>
    m.value !== undefined ? (Array.isArray(m.value) ? m.value : [m.value]) : guessed.length ? guessed : goals && pb.candidates?.kind === "vague" ? pb.candidates.goals : [],
  )
  const [other, setOther] = useState(m.unclear ?? "")
  const [more, setMore] = useState(false)
  // the prices question: the owner can hand over their own price list (uploaded or typed)
  const [prices, setPrices] = useState<PriceList>(() => pb.priceList ?? {})
  // the size question: with several dentists or branches, the owner can hand over their team list
  const [team, setTeam] = useState<TeamList>(() => pb.team ?? {})
  // after the first build the questions replace the builder's guesses, so they count from what's still a guess
  const after = s.phase === "create"
  const { index, total } = questionProgress(after ? sharpenView(pb, book) : pb, m.slot)
  const canGoBack = s.msgs.slice(0, s.msgs.indexOf(m)).some((x) => x.type === "pb-question" && x.answer && x.prev)
  const last = index >= total

  const choice = picked[0]
  const valid = choice === OTHER ? other.trim().length > 1 : picked.length > 0
  const submit = () => {
    if (!valid) return
    if (choice === OTHER) return dispatch({ type: "pbAnswerText", id: m.id, text: other.trim() })
    if (choice === DECIDE) return dispatch({ type: "pbAnswer", id: m.id, value: DECIDE })
    const list = m.slot === "prices" && choice !== "ask" && (prices.file || prices.text?.trim()) ? prices : undefined
    const people = (team.people ?? []).filter((p) => p.name.trim())
    const teamList = m.slot === "scale" && choice !== "solo" && (team.file || people.length) ? { ...team, people } : undefined
    dispatch({ type: "pbAnswer", id: m.id, value: goals || multi ? picked : choice, prices: list, team: teamList })
  }
  const pickOne = (id: string) => setPicked([id])
  const toggle = (g: string, max = 3) =>
    setPicked((p) => {
      const only = p.filter((x) => x !== OTHER && x !== DECIDE)
      return only.includes(g) ? only.filter((x) => x !== g) : only.length < max ? [...only, g] : only
    })
  const toggleGoal = (g: string) => toggle(g)

  const chips = goalChips(pb)
  const goalOptions = several ? pb.candidates!.goals : more ? [...chips.first, ...chips.more] : chips.first
  const goal = (id: string) => book.goals.find((g) => g.id === id)!
  // "I'm not sure" on the jurisdiction gate is the You decide option, so its own "strictest defaults" row is hidden
  const shown = q.decideLabel ? q.options.filter((o) => o.id !== book.defaults[q.slot as "jurisdiction"]) : q.options

  return (
    <Shell
      compact={compact}
      title="Quick questions"
      help={after ? "Your site is built from my best guesses. Each answer replaces one, and I update the site as you go." : "I only ask what I couldn't find in your message or online. Each answer decides which tools and pages your site gets."}
      description={
        after && guessed.length
          ? goals
            ? "Your site is built with the goals picked below. Keep them or change them — the first one is the main goal."
            : "Your site is built with the answer picked below. Keep it, pick another, or write your own."
          : goals
          ? several
            ? "You asked for a lot — let's start with the one that matters most. The rest go under Add later."
            : "Pick up to three. The first one you pick is the main goal — it decides your site's main button."
          : multi
            ? `Pick up to ${q.multi === 3 ? "three" : q.multi}, or write your own. Not sure? Let me decide — you can change anything ${after ? "later" : "on the plan"}.`
            : q.helper && q.id === "QJ"
              ? q.helper
              : `Pick one, or write your own. Not sure? Let me decide — you can change anything ${after ? "later" : "on the plan"}.`
      }
      counter={q.id === "QJ" ? undefined : `${index} / ${total}`}
      question={q.text}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="secondary" onClick={() => dispatch({ type: "pbSkipAll" })}>
            <span className="sm:hidden">{after ? "Keep guesses" : "Skip all"}</span>
            <span className="max-sm:hidden">{after ? "Keep my guesses" : "Skip these questions"}</span>
          </Button>
          <div className="flex items-center gap-2">
            {canGoBack && (
              <Button variant="secondary" size="icon-md" aria-label="Previous question" onClick={() => dispatch({ type: "pbBack", id: m.id })}>
                <ArrowLeft />
              </Button>
            )}
            <Button disabled={!valid} onClick={submit}>
              {last ? (after ? "Update my site" : "See my plan") : "Next question"}
            </Button>
          </div>
        </div>
      }
    >
      <Options multi={(goals && !several) || multi}>
        {goals
          ? goalOptions.map((g) => {
              const on = picked.includes(g)
              const main = picked[0] === g && picked.length > 1
              return (
                <Row
                  key={g}
                  multi={!several}
                  checked={on}
                  label={goal(g).chip}
                  onSelect={() => (several ? pickOne(g) : toggleGoal(g))}
                  trailing={
                    !several && on && picked.length > 1 ? (
                      main ? (
                        <Badge tone="brand" dot={false} className="shrink-0">
                          Main goal
                        </Badge>
                      ) : (
                        <Button size="sm" variant="link" className="shrink-0 type-label-sm" onClick={() => setPicked((p) => [g, ...p.filter((x) => x !== g)])}>
                          Make main
                        </Button>
                      )
                    ) : undefined
                  }
                />
              )
            })
          : shown.map((o) => (
              <Row key={o.id} multi={multi} checked={multi ? picked.includes(o.id) : choice === o.id} label={o.label} onSelect={() => (multi ? toggle(o.id, q.multi) : pickOne(o.id))}>
                {m.slot === "prices" && o.id !== "ask" ? (
                  <PriceListInput value={prices} onChange={setPrices} niche={pb.niche} />
                ) : m.slot === "scale" && o.id !== "solo" ? (
                  <TeamListInput value={team} onChange={setTeam} branches={o.id === "branches"} member={book.copy.member} reg={jurisdictionOf(pb.answers.jurisdiction?.value).registration} niche={pb.niche} />
                ) : undefined}
              </Row>
            ))}
        {goals && !several && !more && (
          <button type="button" onClick={() => setMore(true)} className="flex items-center gap-3 p-4 text-left type-label-md text-fg-link hover:bg-subtle">
            <ChevronDown className="size-5" /> Show {chips.more.length} more goals
          </button>
        )}
        <Row checked={choice === OTHER} label="Something else" description={choice === OTHER ? undefined : "Write it in your own words"} onSelect={() => pickOne(OTHER)}>
          <div className="flex flex-col gap-2">
            <Input
              autoFocus
              aria-label="Your answer"
              value={other}
              onChange={(e) => setOther(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={goals ? (pb.niche === "lawyer" ? "e.g. more clients for family matters" : "e.g. more patients for braces") : "Type your answer here…"}
            />
            {m.unclear && other === m.unclear && <p className="type-body-sm text-status-warning-text">I couldn&apos;t match that to an answer — try other words, or pick one of the options.</p>}
          </div>
        </Row>
        <Row
          checked={choice === DECIDE}
          label={
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-fg-brand" /> {q.decideLabel ?? "You decide"}
            </span>
          }
          description={q.decideLabel ? "I'll use the strictest defaults — you can relax them once you know" : `I'll pick what most ${book.copy.unitShort === "law practice" ? "practices" : "clinics"} choose and tell you why`}
          onSelect={() => pickOne(DECIDE)}
        />
      </Options>
    </Shell>
  )
}

/* ---------------- price list follow-up (Figma 190:1569) ---------------- */

const PRICE_FILES = ".pdf,.xls,.xlsx,.csv,.doc,.docx,.jpg,.jpeg,.png"
const fileSize = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`)

/** under a chosen price option: upload a price list, or type it — or leave it and the agent drafts one */
function PriceListInput({ value, onChange, niche }: { value: PriceList; onChange: (v: PriceList) => void; niche: string }) {
  const law = niche === "lawyer"
  const file = useRef<HTMLInputElement>(null)
  const [typing, setTyping] = useState(!!value.text)
  return (
    <div className="flex flex-col gap-3">
      <input
        ref={file}
        type="file"
        accept={PRICE_FILES}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onChange({ ...value, file: { name: f.name, size: f.size } })
          e.target.value = ""
        }}
      />
      {value.file ? (
        <div className="flex items-center gap-3 self-start rounded-md border border-line-default bg-surface py-2 pr-2 pl-3">
          <FileSpreadsheet className="size-5 shrink-0 text-fg-secondary" strokeWidth={1.5} />
          <span className="flex min-w-0 flex-col">
            <span className="max-w-[220px] truncate type-label-md text-fg-primary">{value.file.name}</span>
            <span className="type-caption text-fg-tertiary">{fileSize(value.file.size)}</span>
          </span>
          <Button size="icon-sm" variant="ghost" aria-label={`Remove ${value.file.name}`} onClick={() => onChange({ ...value, file: undefined })}>
            <X />
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" leadingIcon={<Upload />} onClick={() => file.current?.click()}>
            {law ? "Upload fee schedule" : "Upload pricing document"}
          </Button>
          {!typing && (
            <Button size="sm" variant="secondary" leadingIcon={<Pencil />} onClick={() => setTyping(true)}>
              Type manually
            </Button>
          )}
        </div>
      )}
      {typing && !value.file && (
        <label className="flex flex-col gap-2">
          <span className="type-label-md text-fg-primary">{law ? "Your fees" : "Your prices"}</span>
          <textarea
            autoFocus
            rows={4}
            value={value.text ?? ""}
            onChange={(e) => onChange({ ...value, text: e.target.value })}
            placeholder={law ? "One per line, e.g.\nSimple will — RM 800\nUncontested divorce — from RM 2,500" : "One per line, e.g.\nScaling and polishing — RM 120\nTooth-coloured filling — from RM 150"}
            className="w-full resize-y rounded-md border border-line-strong bg-surface px-4 py-3 type-body-md text-fg-primary placeholder:text-fg-tertiary focus-visible:border-line-focus focus-visible:outline-none focus-visible:focus-ring"
          />
        </label>
      )}
      {!value.file && !value.text?.trim() && <p className="type-caption text-fg-tertiary">No list yet? Leave this — I&apos;ll draft typical {law ? "starting fees" : "prices"} in the brief for you to check.</p>}
    </div>
  )
}

/* ---------------- team follow-up (several dentists or branches) ---------------- */

const TEAM_FILES = ".xls,.xlsx,.csv,.pdf,.doc,.docx"
/** under "Several dentists" / "Several branches" (or lawyers and offices): upload the team list, or add them here — or skip */
function TeamListInput({ value, onChange, branches, member, reg, niche }: { value: TeamList; onChange: (v: TeamList) => void; branches: boolean; member: string; reg: string; niche: string }) {
  const REG = reg
  const Member = member.charAt(0).toUpperCase() + member.slice(1)
  const law = niche === "lawyer"
  const file = useRef<HTMLInputElement>(null)
  const people = value.people ?? []
  const typing = people.length > 0
  const set = (i: number, patch: Partial<TeamMember>) => onChange({ ...value, people: people.map((p, k) => (k === i ? { ...p, ...patch } : p)) })
  const field = "h-10 w-full min-w-0 rounded-md border border-line-strong bg-surface px-3 type-body-sm text-fg-primary placeholder:text-fg-tertiary focus-visible:border-line-focus focus-visible:outline-none focus-visible:focus-ring"
  return (
    <div className="flex flex-col gap-3">
      <input
        ref={file}
        type="file"
        accept={TEAM_FILES}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onChange({ file: { name: f.name, size: f.size } })
          e.target.value = ""
        }}
      />
      {value.file ? (
        <div className="flex items-center gap-3 self-start rounded-md border border-line-default bg-surface py-2 pr-2 pl-3">
          <FileSpreadsheet className="size-5 shrink-0 text-fg-secondary" strokeWidth={1.5} />
          <span className="flex min-w-0 flex-col">
            <span className="max-w-[220px] truncate type-label-md text-fg-primary">{value.file.name}</span>
            <span className="type-caption text-fg-tertiary">{fileSize(value.file.size)}</span>
          </span>
          <Button size="icon-sm" variant="ghost" aria-label={`Remove ${value.file.name}`} onClick={() => onChange({})}>
            <X />
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" leadingIcon={<Upload />} onClick={() => file.current?.click()}>
            Upload team list
          </Button>
          {!typing && (
            <Button size="sm" variant="secondary" leadingIcon={<Pencil />} onClick={() => onChange({ people: [{ name: "" }] })}>
              Add them myself
            </Button>
          )}
        </div>
      )}
      {typing && !value.file && (
        <div className="flex flex-col gap-2">
          <div className={cn("hidden gap-2 type-label-sm text-fg-secondary sm:grid", branches ? "grid-cols-[1.3fr_1fr_1fr_36px]" : "grid-cols-[1.3fr_1fr_36px]")}>
            <span>{Member}&apos;s name</span>
            <span>Registration no. (optional)</span>
            {branches && <span>{law ? "Office" : "Branch"}</span>}
          </div>
          {people.map((p, i) => (
            <div key={i} className={cn("grid gap-2 rounded-md border border-line-default bg-surface p-2 sm:border-0 sm:bg-transparent sm:p-0", branches ? "sm:grid-cols-[1.3fr_1fr_1fr_36px]" : "sm:grid-cols-[1.3fr_1fr_36px]")}>
              <input autoFocus={i === people.length - 1 && !p.name} aria-label={`${Member} ${i + 1} name`} placeholder={law ? "Nadia Aziz" : "Dr. Aisyah Rahman"} value={p.name} onChange={(e) => set(i, { name: e.target.value })} className={field} />
              <input aria-label={`${Member} ${i + 1} ${REG}`} placeholder={law ? "Registration no. (optional)" : `${REG.split(" ")[0]} no. (optional)`} value={p.reg ?? ""} onChange={(e) => set(i, { reg: e.target.value })} className={field} />
              {branches && <input aria-label={`${Member} ${i + 1} ${law ? "office" : "branch"}`} placeholder={law ? "e.g. Bangsar" : "e.g. Air Itam"} value={p.branch ?? ""} onChange={(e) => set(i, { branch: e.target.value })} className={field} />}
              <Button size="icon-sm" variant="ghost" aria-label={`Remove ${member} ${i + 1}`} className="justify-self-end" onClick={() => onChange({ ...value, people: people.filter((_, k) => k !== i) })}>
                <X />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="ghost" leadingIcon={<Plus />} className="self-start" onClick={() => onChange({ ...value, people: [...people, { name: "" }] })}>
            Add another {member}
          </Button>
        </div>
      )}
      {!value.file && !people.some((p) => p.name.trim()) && <p className="type-caption text-fg-tertiary">Prefer to do it later? Skip this — you can add your {member}s in the brief.</p>}
    </div>
  )
}

/* ---------------- gates (one practice or a directory, two businesses) ---------------- */

export function GateCard({ m, compact }: { m: GateMsg; compact?: boolean }) {
  const { s, dispatch } = useGen()
  const book = playbookOf(s.pb!)
  const unit = book.copy.unitShort
  const many = `${book.copy.member}s`
  const [pick, setPick] = useState<string | null>(null)
  if (m.answer) return null
  const g =
    m.kind === "two-sites"
      ? { question: "That sounds like two different businesses. How should I start?", description: "Each business gets its own website, plan and add-ons.", choices: [["two", `Two websites — start with the ${unit}`], ["only", `Just the ${unit}`]] }
      : m.kind === "directory"
        ? { question: book.questions[0].text, description: `A practice website and a directory of many ${many} are built very differently.`, choices: [["one", "One practice"], ["directory", `A directory of many ${many}`]] }
        : { question: "Do you run one of the practices yourself?", description: "If you do, I can build its website instead.", choices: [["one", "Yes — build my practice's website"]] }
  return (
    <Shell
      compact={compact}
      title="Before I plan"
      description={g.description}
      question={g.question}
      footer={
        <div className="flex justify-end">
          <Button disabled={!pick} onClick={() => pick && dispatch({ type: "pbGate", id: m.id, answer: pick })}>
            Continue
          </Button>
        </div>
      }
    >
      <Options>
        {g.choices.map(([id, label]) => (
          <Row key={id} checked={pick === id} label={label} onSelect={() => setPick(id)} />
        ))}
      </Options>
    </Shell>
  )
}

/* ---------------- after the series ---------------- */

/** once every question is answered: the answers in one place (shown where the last question was) */
export function AnswersSummary({ compact }: { compact?: boolean }) {
  const { s } = useGen()
  const [open, setOpen] = useState(false)
  const answered = s.msgs.filter((m): m is QuestionMsg => m.type === "pb-question" && !!m.answer)
  const book = playbookOf(s.pb!)
  const text = (m: QuestionMsg) => book.questions.find((x) => x.id === m.qid && (!m.variant || x.variant === m.variant))!.text
  return (
    <div className={cn("flex flex-col gap-3 rounded-lg border border-line-default bg-subtle p-4", !compact && "sm:mr-20")}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center justify-between gap-3 text-left">
        <span className="flex items-center gap-2 type-label-md text-fg-primary">
          <Check className="size-4 text-status-success-text" /> {answered.length} {answered.length === 1 ? "question" : "questions"} answered
        </span>
        <ChevronDown className={cn("size-4 text-fg-secondary transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <dl className="flex flex-col gap-3">
          {answered.map((m) => (
            <div key={m.id} className="flex flex-col gap-0.5">
              <dt className="type-body-sm text-fg-tertiary">{text(m)}</dt>
              <dd className="type-body-sm text-fg-primary">{m.answer}</dd>
              {m.note && <dd className="type-caption text-fg-secondary">{m.note}</dd>}
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
