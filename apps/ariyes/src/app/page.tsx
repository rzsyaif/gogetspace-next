import { redirect } from "next/navigation"
import { listProjects } from "@gogetspace/modules/mock"

/** signed in: open the first project (a real app would remember the last one) */
export default async function Home() {
  const [first] = await listProjects()
  redirect(`/${first.id}`)
}
