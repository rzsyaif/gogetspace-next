"use client"

import { useState } from "react"
import { Check, Code2, Copy } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, SegmentedControl, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import { cn } from "@/lib/cn"
import type { Snippet } from "./snippets"

/** Copy text, falling back to a hidden textarea where the Clipboard API isn't allowed. */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.style.position = "fixed"
    ta.style.opacity = "0"
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand("copy")
    ta.remove()
    return ok
  }
}

export function CopyButton({ text, label = "Copy", className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      size="sm"
      variant="secondary"
      leadingIcon={copied ? <Check /> : <Copy />}
      className={className}
      aria-live="polite"
      onClick={async () => {
        if (await copyText(text)) {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1600)
        }
      }}
    >
      {copied ? "Copied" : label}
    </Button>
  )
}

/** A block of code with its own copy button. */
export function CodeBlock({ code, label, maxHeight = 380, copyLabel }: { code: string; label: string; maxHeight?: number; copyLabel?: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-line-default bg-subtle">
      <div className="flex items-center gap-3 border-b border-line-default py-2 pr-2 pl-4">
        <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-fg-tertiary">{label}</span>
        <CopyButton text={code} label={copyLabel} />
      </div>
      <pre className="overflow-auto p-4 font-mono text-[13px] leading-[1.6] text-fg-primary" style={{ maxHeight }} tabIndex={0} aria-label={label}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

/** names a component file imports from, so the Source tab can say what else to copy */
function dependencies(source: string) {
  const pkgs = new Set<string>()
  const local = new Set<string>()
  for (const m of source.matchAll(/from "([^"]+)"/g)) {
    const from = m[1]
    if (from === "react") continue
    if (from.startsWith(".") || from.startsWith("@/")) local.add(from.replace(/^\.\//, "ui/").replace("@/", ""))
    else pkgs.add(from)
  }
  return { pkgs: [...pkgs], local: [...local] }
}

/**
 * Code for a section's components, collapsed until opened: pick a component, then copy its usage (import + JSX) or
 * the whole source file.
 */
export function CodePanel({ items, sources }: { items: Snippet[]; sources: Record<string, string> }) {
  const [view, setView] = useState<"usage" | "source">("usage")
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="code">
        <AccordionTrigger meta={items.map((it) => it.name).join(" · ")}>
          <Code2 /> Code
        </AccordionTrigger>
        <AccordionContent>
          <Tabs defaultValue={items[0].name} className="flex min-w-0 flex-col gap-3">
            <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center">
              <TabsList aria-label="Component" className="max-w-full overflow-x-auto [&>*]:shrink-0">
                {items.map((it) => (
                  <TabsTrigger key={it.name} value={it.name}>
                    {it.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              <SegmentedControl
                label="Show"
                size="sm"
                value={view}
                onChange={setView}
                options={[
                  { value: "usage", label: "Usage" },
                  { value: "source", label: "Source" },
                ]}
                className="self-start md:ml-auto md:self-auto"
              />
            </div>
            {items.map((it) => {
              const importLine = `import { ${it.exports.join(", ")} } from "${it.from}"`
              const source = sources[it.file] ?? ""
              const deps = dependencies(source)
              return (
                <TabsContent key={it.name} value={it.name} className="flex min-w-0 flex-col gap-3">
                  {view === "usage" ? (
                    <CodeBlock label={`${it.name} · usage`} code={`${importLine}\n${it.usage.startsWith("import") ? "" : "\n"}${it.usage}`} />
                  ) : (
                    <>
                      <CodeBlock label={it.file} code={source} maxHeight={480} copyLabel="Copy file" />
                      <p className={cn("type-caption text-fg-tertiary")}>
                        Needs {deps.pkgs.length ? <code className="font-mono">{deps.pkgs.join(", ")}</code> : "no packages"}
                        {deps.local.length > 0 && (
                          <>
                            {" "}
                            and <code className="font-mono">{deps.local.join(", ")}</code>
                          </>
                        )}
                        , plus the setup files at the top of this page.
                      </p>
                    </>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

/** A file shown collapsed: its path in the header, the note and code (with copy) when opened. */
export function CodeFile({ file, note, code }: { file: string; note: string; code: string }) {
  return (
    <AccordionItem value={file}>
      <AccordionTrigger meta={`${code.split("\n").length} lines`}>
        <Code2 /> <span className="truncate font-mono text-[13px]">{file}</span>
      </AccordionTrigger>
      <AccordionContent className="flex flex-col gap-3">
        <p className="type-body-sm text-fg-secondary">{note}</p>
        <CodeBlock label={file} code={code} maxHeight={420} copyLabel="Copy file" />
      </AccordionContent>
    </AccordionItem>
  )
}
