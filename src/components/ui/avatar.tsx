import { Avatar as AvatarPrimitive } from "radix-ui"
import { User } from "lucide-react"
import { cn } from "@/lib/cn"

const SIZES = {
  sm: "size-8 type-label-sm",
  md: "size-10 type-label-md",
  lg: "size-14 type-label-lg",
} as const

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name?: string
  src?: string
  size?: keyof typeof SIZES
  className?: string
}) {
  const initials = name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")
  return (
    <AvatarPrimitive.Root
      className={cn("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-accent-blue-subtle text-fg-link", SIZES[size], className)}
    >
      {src && <AvatarPrimitive.Image src={src} alt={name ?? ""} className="size-full object-cover" />}
      <AvatarPrimitive.Fallback delayMs={src ? 300 : 0} className="grid size-full place-items-center">
        {initials ? <span aria-label={name}>{initials}</span> : <User aria-hidden className="size-1/2" />}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}
