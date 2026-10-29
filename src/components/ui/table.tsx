import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react"
import { cn } from "@/lib/cn"

/**
 * Data table in a bordered box: grey header row, hairline row dividers, small body text. The box scrolls sideways
 * on narrow screens instead of squashing columns: cells don't wrap unless you add `whitespace-normal`.
 * Use `align="right"` on number columns.
 */
export function Table({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line-default">
      <table className={cn("w-full text-left", className)} {...props}>
        {children}
      </table>
    </div>
  )
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-subtle type-label-sm text-fg-secondary", className)} {...props} />
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-line-default type-body-sm text-fg-primary", className)} {...props} />
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("hover:bg-subtle/50", className)} {...props} />
}

export function TableHeaderCell({ className, align, ...props }: ThHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" }) {
  return <th scope="col" className={cn("px-4 py-3 font-medium whitespace-nowrap", align === "right" && "text-right", className)} {...props} />
}

export function TableCell({ className, align, ...props }: TdHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" }) {
  return <td className={cn("px-4 py-3 align-middle whitespace-nowrap", align === "right" && "text-right tabular-nums", className)} {...props} />
}

/** Row shown when filters leave nothing to list. */
export function TableEmpty({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center type-body-sm text-fg-tertiary">
        {children}
      </td>
    </tr>
  )
}
