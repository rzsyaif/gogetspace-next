import type { ToolId } from "./catalog"

/**
 * A project is one website. Publishing a GoGetSpace site (and signing up) creates the Ariyes account and a
 * project with the same name, with the default tools and the modules the site was built with already installed.
 */
export interface Project {
  id: string
  name: string
  /** the live address of the website */
  domain: string
  plan: "Free" | "Starter" | "Business"
  /** add-ons installed on this project, in the order they were added (defaults are always there) */
  installed: ToolId[]
  /** for money amounts in previews */
  currency: string
}

export interface Member {
  name: string
  email: string
  role: "Owner" | "Admin" | "Staff"
}
