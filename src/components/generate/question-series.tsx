"use client"

import { useState, type ReactNode } from "react"
import { motion } from "motion/react"
import { ArrowLeft, Check, ChevronDown, CircleHelp, Sparkles } from "lucide-react"
import { Badge, Button, Input, RadioDot, Tooltip } from "@/components/ui"
import { cn } from "@/lib/cn"
import type { Msg } from "@/lib/generation/state"
import { DENTIST } from "@/lib/playbooks/dentist"
import { goalChips, questionProgress } from "@/lib/playbooks/engine"
import { useGen } from "./gen-provider"

type QuestionMsg = Extract<Msg, { type: "pb-question" }>
type GateMsg = Extract<Msg, { type: "pb-gate" }>

const OTHER = "__other"
const DECIDE = "decide"

/* ---------------- shell (Figma "Question popover", 125:982) ---------------- */

function Shell({
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
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 type-body-md text-fg-primary">{question}</legend>
        {children}
      </fieldset>
      {footer}
    </section>
  )
}

/** the bordered list of answers; the chosen row is tinted and can show more under it */
function Options({ children, multi }: { children: ReactNode; multi?: boolean }) {
  return (
    <div role={multi ? "group" : "radiogroup"} className="flex flex-col divide-y divide-line-default overflow-hidden rounded-[16px] border border-line-default">
      {children}
    </div>
  )
}

function Row({
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
  const q = DENTIST.questions.find((x) => x.id === m.qid && (!m.variant || x.variant === m.variant))!
  const goals = m.slot === "goals"
  const several = goals && pb.candidates?.kind === "several"
  const [picked, setPicked] = useState<string[]>(() =>
    m.value !== undefined ? (Array.isArray(m.value) ? m.value : [m.value]) : goals && pb.candidates?.kind === "vague" ? pb.candidates.goals : [],
  )
  const [other, setOther] = useState(m.unclear ?? "")
  const [more, setMore] = useState(false)
  const { index, total } = questionProgress(pb, m.slot)
  const canGoBack = s.msgs.slice(0, s.msgs.indexOf(m)).some((x) => x.type === "pb-question" && x.answer && x.prev)
  const last = index >= total

  const choice = picked[0]
  const valid = choice === OTHER ? other.trim().length > 1 : picked.length > 0
  const submit = () => {
    if (!valid) return
    if (choice === OTHER) return dispatch({ type: "pbAnswerText", id: m.id, text: other.trim() })
    if (choice === DECIDE) return dispatch({ type: "pbAnswer", id: m.id, value: DECIDE })
    dispatch({ type: "pbAnswer", id: m.id, value: goals ? picked : choice })
  }
  const pickOne = (id: string) => setPicked([id])
  const toggleGoal = (g: string) =>
    setPicked((p) => {
      const goalsOnly = p.filter((x) => x !== OTHER && x !== DECIDE)
      return goalsOnly.includes(g) ? goalsOnly.filter((x) => x !== g) : goalsOnly.length < 3 ? [...goalsOnly, g] : goalsOnly
    })

  const chips = goalChips(pb)
  const goalOptions = several ? pb.candidates!.goals : more ? [...chips.first, ...chips.more] : chips.first
  const goal = (id: string) => DENTIST.goals.find((g) => g.id === id)!

  return (
    <Shell
      compact={compact}
      title="Quick questions"
      help="I only ask what I couldn't find in your message or online. Each answer decides which tools and pages your site gets."
      description={
        goals
          ? several
            ? "You asked for a lot — let's start with the one that matters most. The rest go under Add later."
            : "Pick up to three. The first one you pick is the main goal — it decides your site's main button."
          : "Pick one, or write your own. Not sure? Let me decide — you can change anything on the plan."
      }
      counter={`${index} / ${total}`}
      question={q.text}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="secondary" onClick={() => dispatch({ type: "pbSkipAll" })}>
            <span className="sm:hidden">Skip all</span>
            <span className="max-sm:hidden">Skip these questions</span>
          </Button>
          <div className="flex items-center gap-2">
            {canGoBack && (
              <Button variant="secondary" size="icon-md" aria-label="Previous question" onClick={() => dispatch({ type: "pbBack", id: m.id })}>
                <ArrowLeft />
              </Button>
            )}
            <Button disabled={!valid} onClick={submit}>
              {last ? "See my plan" : "Next question"}
            </Button>
          </div>
        </div>
      }
    >
      <Options multi={goals && !several}>
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
          : q.options.map((o) => <Row key={o.id} checked={choice === o.id} label={o.label} onSelect={() => pickOne(o.id)} />)}
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
              placeholder={goals ? "e.g. more patients for braces" : "Type your answer here…"}
            />
            {m.unclear && other === m.unclear && <p className="type-body-sm text-status-warning-text">I couldn&apos;t match that to an answer — try other words, or pick one of the options.</p>}
          </div>
        </Row>
        <Row
          checked={choice === DECIDE}
          label={
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-fg-brand" /> You decide
            </span>
          }
          description="I'll pick what most clinics choose and tell you why"
          onSelect={() => pickOne(DECIDE)}
        />
      </Options>
    </Shell>
  )
}

/* ---------------- gates (one practice or a directory, two businesses) ---------------- */

export function GateCard({ m, compact }: { m: GateMsg; compact?: boolean }) {
  const { dispatch } = useGen()
  const [pick, setPick] = useState<string | null>(null)
  if (m.answer) return null
  const g =
    m.kind === "two-sites"
      ? { question: "That sounds like two different businesses. How should I start?", description: "Each business gets its own website, plan and add-ons.", choices: [["two", "Two websites — start with the dental clinic"], ["only", "Just the dental clinic"]] }
      : m.kind === "directory"
        ? { question: DENTIST.questions[0].text, description: "A practice website and a directory of many dentists are built very differently.", choices: [["one", "One practice"], ["directory", "A directory of many dentists"]] }
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
  const text = (m: QuestionMsg) => DENTIST.questions.find((x) => x.id === m.qid && (!m.variant || x.variant === m.variant))!.text
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
