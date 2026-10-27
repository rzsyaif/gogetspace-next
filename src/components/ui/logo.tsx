import { cn } from "@/lib/cn"

/** GoGetSpace logo: a 2×2 stud brick plus the wordmark. `markOnly` drops the wordmark. */
export function Logo({ markOnly = false, size = 32, className }: { markOnly?: boolean; size?: number; className?: string }) {
  const stud = Math.round(size * 0.28)
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="grid shrink-0 place-content-center rounded-md bg-blue-500 shadow-[0_2px_0_0_var(--color-blue-800)]"
        style={{ width: size, height: size, gridTemplateColumns: `repeat(2, ${stud}px)`, gap: Math.round(size * 0.125) }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="rounded-full bg-white/90" style={{ width: stud, height: stud }} />
        ))}
      </span>
      {markOnly ? <span className="sr-only">GoGetSpace</span> : <span className="type-h5 text-fg-primary">GoGetSpace</span>}
    </span>
  )
}
