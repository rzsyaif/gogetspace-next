import type { Metadata } from "next"
import { Badge } from "@gogetspace/baseplate"
import { getHomeLayout, getMe, getPeeks, getProject } from "@gogetspace/modules/mock"
import { HomeTools } from "@/components/home-tools"

export async function generateMetadata({ params }: PageProps<"/[project]">): Promise<Metadata> {
  const project = await getProject((await params).project)
  return { title: project.name }
}

/** a project's home: every tool it has as a widget, each showing a peek of what's new */
export default async function ProjectHome({ params }: PageProps<"/[project]">) {
  const { project: id } = await params
  const [project, me, peeks, layout] = await Promise.all([getProject(id), getMe(), getPeeks(id), getHomeLayout(id)])
  const first = me.name.split(" ")[0]
  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
      <HomeTools
        project={project}
        peeks={peeks}
        layout={layout}
        header={
          <div className="flex flex-col gap-2">
            <h1 className="type-h2 text-fg-primary">Welcome back, {first}</h1>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 type-body-md text-fg-secondary">
              <span>{project.name}</span>
              <span aria-hidden>·</span>
              <span>{project.domain}</span>
              <Badge tone="success">Live</Badge>
            </p>
          </div>
        }
      />
    </main>
  )
}
