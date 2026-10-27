import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Teach tailwind-merge about Baseplate's custom type utilities so `type-h1` and `type-body-sm` override each other.
const twMerge = extendTailwindMerge<"baseplate-type">({
  extend: {
    classGroups: {
      "baseplate-type": [
        {
          type: [
            "display", "h1", "h2", "h3", "h4", "h5", "h6",
            "body-lg", "body-md", "body-sm", "label-lg", "label-md", "label-sm", "caption",
          ],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
