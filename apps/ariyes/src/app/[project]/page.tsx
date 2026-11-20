import type { Metadata } from "next"
import { Badge } from "@gogetspace/baseplate"
import { getMe, getPeeks, getProject } from "@gogetspace/modules/mock"
import { HomeTools } from "@/components/home-tools"

export async function generateMetadata({ params }: PageProps<"/[project]">): Promise<Metadata> {
  const project = await getProject((await params).project)
  return { title: project.name }
}

/** a project's home: every tool it has, each showing a peek of what's new */
export default async function ProjectHome({ params }: PageProps<"/[project]">) {
  const { project: id } = await params
  const [project, me, peeks] = await Promise.all([getProject(id), getMe(), getPeeks(id)])
  const first = me.name.split(" ")[0]
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="type-h2 text-fg-primary">Welcome back, {first}</h1>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 type-body-md text-fg-secondary">
          <span>{project.name}</span>
          <span aria-hidden>·</span>
          <span>{project.domain}</span>
          <Badge tone="success">Live</Badge>
        </p>
      </div>
      <HomeTools project={project} peeks={peeks} />
    </div>
  )
}
