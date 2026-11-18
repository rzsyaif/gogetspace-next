import type { ModuleDef } from "./types"

/** core modules every niche shares (same id, same card) */
export const CONTACT_MODULE: ModuleDef = { id: "contact", name: "Contact and Locations", core: true, price: 0, benefit: {}, included: ["Address, map, hours, phone and WhatsApp on every page"] }
export const INBOX_MODULE: ModuleDef = { id: "inbox", name: "Enquiry inbox", core: true, price: 0, benefit: {}, included: ["Messages from your contact form in one place"] }
