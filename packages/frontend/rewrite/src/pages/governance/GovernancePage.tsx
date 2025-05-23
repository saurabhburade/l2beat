import type { DelegatedProjectWithIcon } from '~/app/(side-nav)/governance/_page'
import { GovernancePage as NextGovernancePage } from '~/app/(side-nav)/governance/_page'
import type { GovernanceEventEntry } from '~/app/(side-nav)/governance/_utils/get-governance-event-entries'
import type { GovernancePublicationEntry } from '~/app/(side-nav)/governance/_utils/get-governance-publication-entry'
import { SideNavLayout } from '~/app/(side-nav)/side-nav-layout'
import type { AppLayoutProps } from '~/app/_layout'
import { AppLayout } from '~/app/_layout'

interface Props extends AppLayoutProps {
  publications: GovernancePublicationEntry[]
  events: GovernanceEventEntry[]
  delegatedProjects: DelegatedProjectWithIcon[]
}

export function GovernancePage({
  publications,
  events,
  delegatedProjects,
  ...props
}: Props) {
  return (
    <AppLayout {...props}>
      <SideNavLayout>
        <NextGovernancePage
          publications={publications}
          events={events}
          delegatedProjects={delegatedProjects}
        />
      </SideNavLayout>
    </AppLayout>
  )
}
