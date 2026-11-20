/**
 * Every tool a project can have, in one list. GoGetSpace sells some of them as modules while building a site;
 * Ariyes is where they run once the site is published. Plain data (icons are lucide names) so a backend can
 * read the same list.
 */

export type ToolId =
  | "appointments"
  | "payments"
  | "estimates"
  | "reviews"
  | "locations"
  | "inbox"
  | "contacts"
  | "crm"
  | "campaigns"
  | "sequences"
  | "broadcasts"
  | "helpdesk"
  | "todo"
  | "drive"
  | "settings"

export interface Tool {
  id: ToolId
  name: string
  /** one line, for the "add a tool" list */
  description: string
  /** lucide-react icon name */
  icon: string
  /** default tools come with every project; add-ons are installed per project */
  kind: "default" | "addon"
  /** monthly price per project, for add-ons that have one set (USD) */
  price?: number
  /** the GoGetSpace modules (from any playbook) that install it while building the site; their Manage opens this tool */
  gogetspaceModules?: string[]
  /** colour family for the tile's icon */
  accent: "blue" | "green" | "yellow" | "coral" | "neutral"
}

export const TOOLS: Tool[] = [
  // from GoGetSpace modules
  { id: "appointments", name: "Appointments", description: "Online booking with reminders the day before.", icon: "CalendarCheck", kind: "addon", price: 12, gogetspaceModules: ["appointments", "consultations"], accent: "blue" },
  { id: "payments", name: "Payments", description: "Deposits and packages paid online, receipts sent for you.", icon: "CreditCard", kind: "addon", price: 9, gogetspaceModules: ["payments", "legal-payments"], accent: "green" },
  { id: "estimates", name: "Estimates", description: "Quote requests for bigger treatments or cases.", icon: "FileText", kind: "addon", price: 9, gogetspaceModules: ["estimates", "fee-proposals"], accent: "coral" },
  { id: "reviews", name: "Reviews", description: "Ask happy patients for a review after their visit.", icon: "Star", kind: "addon", price: 4, gogetspaceModules: ["reviews", "legal-reviews"], accent: "yellow" },
  { id: "locations", name: "Branches", description: "Several locations, each with its own hours and bookings.", icon: "MapPin", kind: "addon", price: 8, gogetspaceModules: ["branches"], accent: "blue" },
  // Ariyes tools
  { id: "inbox", name: "Inbox", description: "Every message from your website, email and chat in one place.", icon: "Inbox", kind: "default", gogetspaceModules: ["inbox", "enquiries", "case-enquiries"], accent: "blue" },
  { id: "contacts", name: "Contacts", description: "Everyone who booked, paid or got in touch.", icon: "Users", kind: "default", accent: "neutral" },
  { id: "crm", name: "CRM", description: "Follow each patient or client from first enquiry to coming back.", icon: "KanbanSquare", kind: "addon", price: 10, gogetspaceModules: ["crm", "law-clients", "client-updates"], accent: "green" },
  { id: "campaigns", name: "Campaigns", description: "Email campaigns to your contacts, like check-up reminders.", icon: "Megaphone", kind: "addon", accent: "coral" },
  { id: "sequences", name: "Sequences", description: "Follow-up emails that send themselves on a schedule.", icon: "Repeat", kind: "addon", accent: "neutral" },
  { id: "broadcasts", name: "Broadcasts", description: "One message to many people on WhatsApp or SMS.", icon: "RadioTower", kind: "addon", accent: "yellow" },
  { id: "helpdesk", name: "Help Desk", description: "Questions and requests as tickets your team can share.", icon: "LifeBuoy", kind: "addon", accent: "neutral" },
  { id: "todo", name: "To-Do", description: "Your team's tasks, with due dates.", icon: "SquareCheck", kind: "default", accent: "neutral" },
  { id: "drive", name: "Drive", description: "Photos, documents and forms for this project.", icon: "HardDrive", kind: "default", accent: "neutral" },
  { id: "settings", name: "Settings", description: "Plan, domain, team and billing.", icon: "Settings", kind: "default", accent: "neutral" },
]

export const toolById = (id: ToolId) => TOOLS.find((t) => t.id === id)!

/** the default tools, in home-screen order */
export const DEFAULT_TOOLS = TOOLS.filter((t) => t.kind === "default").map((t) => t.id)

/** the Ariyes tool a GoGetSpace module is managed in, if it has one (content-only modules don't) */
export const toolForModule = (module: string) => TOOLS.find((t) => t.gogetspaceModules?.includes(module))
