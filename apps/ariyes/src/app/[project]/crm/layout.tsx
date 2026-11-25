import { getProject } from "@gogetspace/modules/mock"
import { CrmProvider } from "@/components/crm/crm-store"
import { CrmShell } from "@/components/crm/crm-shell"

/** the CRM's pages share one state (so a move on Home shows on Pipeline) and one layout with the CRM sidebar */
export default async function CrmLayout({ params, children }: LayoutProps<"/[project]/crm">) {
  const project = await getProject((await params).project)
  return (
    <CrmProvider project={project}>
      <CrmShell>{children}</CrmShell>
    </CrmProvider>
  )
}
