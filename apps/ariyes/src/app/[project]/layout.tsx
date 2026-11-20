import { notFound } from "next/navigation"
import { getMe, listProjects } from "@gogetspace/modules/mock"
import { TopBar } from "@/components/top-bar"

export async function generateStaticParams() {
  return (await listProjects()).map((p) => ({ project: p.id }))
}

export default async function ProjectLayout({ children, params }: LayoutProps<"/[project]">) {
  const { project: id } = await params
  const [projects, me] = await Promise.all([listProjects(), getMe()])
  const project = projects.find((p) => p.id === id)
  if (!project) notFound()
  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <TopBar project={project} projects={projects} me={me} />
      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-4 pt-10 pb-20 sm:px-6 sm:pt-14">{children}</main>
    </div>
  )
}
