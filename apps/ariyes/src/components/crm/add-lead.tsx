"use client"

import { useState } from "react"
import { Button, Drawer, DrawerContent, Field, Input, Select } from "@gogetspace/baseplate"
import { SOURCES, type LeadSource } from "@gogetspace/modules"
import { useCrm } from "./crm-store"

const EMPTY = { name: "", phone: "", email: "", title: "", value: "", source: "walk-in" as LeadSource, companyId: "" }

/**
 * Add new lead: someone who phoned or walked in (website enquiries arrive on their own). Saving puts them in the
 * first stage with the next step "Get in touch", so they show up in Follow up today.
 */
export function AddLead() {
  const { data, currency, addOpen, setAddOpen, addLead, setOpenClient } = useCrm()
  const [f, setF] = useState(EMPTY)
  const [tried, setTried] = useState(false)
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setF((x) => ({ ...x, [k]: v }))
  const errors = {
    name: !f.name.trim() ? "Add their name" : null,
    contact: !f.phone.trim() && !f.email.trim() ? "Add a phone number or an email, so you can get back to them" : f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim()) ? "That email doesn't look right" : null,
    title: !f.title.trim() ? "Add what they're after, in a few words" : null,
    value: f.value.trim() && !(Number(f.value.replace(/,/g, "")) >= 0) ? "Use a number, e.g. 1200" : null,
  }
  const ok = !Object.values(errors).some(Boolean)
  const close = () => {
    setAddOpen(false)
    setF(EMPTY)
    setTried(false)
  }
  const save = () => {
    setTried(true)
    if (!ok) return
    const id = addLead({
      name: f.name.trim(),
      phone: f.phone.trim() || undefined,
      email: f.email.trim() || undefined,
      title: f.title.trim(),
      value: f.value.trim() ? Number(f.value.replace(/,/g, "")) : undefined,
      source: f.source,
      companyId: f.companyId || undefined,
    })
    close()
    setOpenClient(id)
  }
  const show = (e: string | null) => (tried ? e : null)

  return (
    <Drawer open={addOpen} onOpenChange={(o) => (o ? setAddOpen(true) : close())}>
      <DrawerContent
        title="Add new lead"
        className="w-[min(420px,calc(100vw-24px))]"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button onClick={save}>Add lead</Button>
          </div>
        }
      >
        <form
          className="flex flex-col gap-5 px-1 pb-4"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <p className="type-body-sm text-fg-secondary">For people who phone or walk in. Enquiries from your website are added for you.</p>
          <Field label="Name" error={show(errors.name)}>
            <Input value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="off" placeholder="e.g. Nur Aina" />
          </Field>
          <Field label="Phone" error={show(errors.contact)} helper={!tried ? "A phone number or an email is enough." : undefined}>
            <Input type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+60 12-345 6789" />
          </Field>
          <Field label="Email">
            <Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="name@example.com" />
          </Field>
          <Field label="What they're after" error={show(errors.title)}>
            <Input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Braces consultation" maxLength={80} />
          </Field>
          <Field label="Value (optional)" error={show(errors.value)} helper="Roughly what the work is worth. Leave it empty if it doesn't matter.">
            <Input inputMode="numeric" value={f.value} onChange={(e) => set("value", e.target.value)} placeholder="0" leadingIcon={<span className="type-body-md text-fg-tertiary">{currency}</span>} />
          </Field>
          <div className="flex flex-col gap-2">
            <span className="type-label-md text-fg-primary">How they found you</span>
            <Select ariaLabel="How they found you" value={f.source} onValueChange={(v) => set("source", v as LeadSource)} options={SOURCES.filter((s) => s.id !== "website").map((s) => ({ value: s.id, label: s.label }))} />
          </div>
          {data?.settings.companies && data.companies.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="type-label-md text-fg-primary">Company (optional)</span>
              <Select ariaLabel="Company" placeholder="None" value={f.companyId} onValueChange={(v) => set("companyId", v)} options={data.companies.map((c) => ({ value: c.id, label: c.name }))} />
            </div>
          )}
          <button type="submit" hidden />
        </form>
      </DrawerContent>
    </Drawer>
  )
}
