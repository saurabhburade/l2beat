import type { Project } from '@l2beat/config'
import type { ProjectValueRecord } from '@l2beat/database'
import { UnixTime } from '@l2beat/shared-pure'
import groupBy from 'lodash/groupBy'
import pick from 'lodash/pick'
import { unstable_cache as cache } from 'next/cache'
import { z } from 'zod'
import { env } from '~/env'
import { getDb } from '~/server/database'
import { ps } from '~/server/projects'
import { calculatePercentageChange } from '~/utils/calculate-percentage-change'
import { getTvsProjects } from './utils/get-tvs-projects'
import { getTvsTargetTimestamp } from './utils/get-tvs-target-timestamp'

export function get7dTvsBreakdown(
  ...parameters: Parameters<typeof getCached7dTokenBreakdown>
) {
  if (env.MOCK) {
    return getMockTvsBreakdownData()
  }
  return getCached7dTokenBreakdown(...parameters)
}

export interface SevenDayTvsBreakdown {
  total: number
  projects: Record<string, ProjectSevenDayTvsBreakdown>
}

export interface ProjectSevenDayTvsBreakdown {
  breakdown: BreakdownSplit & {
    ether: number
    stablecoin: number
  }
  associated: BreakdownSplit
  change: BreakdownSplit
  changeExcludingAssociated: BreakdownSplit
}

export interface BreakdownSplit {
  total: number
  canonical: number
  external: number
  native: number
}

export const TvsBreakdownProjectFilter = z.discriminatedUnion('type', [
  z.object({
    type: z.enum(['all', 'layer2', 'bridge']),
  }),
  z.object({ type: z.literal('projects'), projectIds: z.array(z.string()) }),
])

type TvsBreakdownProjectFilter = z.infer<typeof TvsBreakdownProjectFilter>

const getCached7dTokenBreakdown = cache(
  async (props: TvsBreakdownProjectFilter): Promise<SevenDayTvsBreakdown> => {
    const db = getDb()
    const target = getTvsTargetTimestamp()

    const [tvsProjects, records] = await Promise.all([
      getTvsProjects(createTvsBreakdownProjectFilter(props)),
      db.tvsProjectValue.getByTypeAndRange(
        ['PROJECT', 'PROJECT_WA'],
        [target - 30 * UnixTime.DAY, null],
      ),
    ])
    const comparisionRecords = getComparisionRecords(records, target)

    const valuesByProject = pick(
      comparisionRecords,
      tvsProjects.map((p) => p.projectId),
    )

    const projects = Object.fromEntries(
      Object.entries(valuesByProject).map(
        ([projectId, projectValues]): [string, ProjectSevenDayTvsBreakdown] => {
          const { current, previous, currentWa, previousWa } = projectValues

          return [
            projectId,
            {
              breakdown: {
                total: current.value,
                native: current.native,
                canonical: current.canonical,
                external: current.external,
                ether: current.ether,
                stablecoin: current.stablecoin,
              },
              associated: {
                total: current.associated,
                native: current.native - currentWa.native,
                canonical: current.canonical - currentWa.canonical,
                external: current.external - currentWa.external,
              },
              change: {
                total: calculatePercentageChange(current.value, previous.value),
                native: calculatePercentageChange(
                  current.native,
                  previous.native,
                ),
                canonical: calculatePercentageChange(
                  current.canonical,
                  previous.canonical,
                ),
                external: calculatePercentageChange(
                  current.external,
                  previous.external,
                ),
              },
              changeExcludingAssociated: {
                total: calculatePercentageChange(
                  currentWa.value,
                  previousWa.value,
                ),
                native: calculatePercentageChange(
                  currentWa.native,
                  previousWa.native,
                ),
                canonical: calculatePercentageChange(
                  currentWa.canonical,
                  previousWa.canonical,
                ),
                external: calculatePercentageChange(
                  currentWa.external,
                  previousWa.external,
                ),
              },
            },
          ]
        },
      ),
    )

    const total = Object.values(projects).reduce(
      (acc, { breakdown }) => acc + breakdown.total,
      0,
    )

    return {
      total,
      projects,
    }
  },
  ['getCached7dTokenBreakdown'],
  {
    tags: ['hourly-data'],
    revalidate: UnixTime.HOUR,
  },
)

function getComparisionRecords(
  records: ProjectValueRecord[],
  target: UnixTime,
) {
  const result: Record<
    string,
    {
      current: ProjectValueRecord
      previous: ProjectValueRecord
      currentWa: ProjectValueRecord
      previousWa: ProjectValueRecord
    }
  > = {}
  const byProject = groupBy(records, (r) => r.project)

  for (const [project, byProjectRecords] of Object.entries(byProject)) {
    const byType = groupBy(byProjectRecords, (r) => r.type)
    const current = byType.PROJECT?.find((r) => r.timestamp <= target)
    const previous = byType.PROJECT?.find(
      (r) => r.timestamp <= target - 7 * UnixTime.DAY,
    )
    const currentWa = byType.PROJECT_WA?.find((r) => r.timestamp <= target)
    const previousWa = byType.PROJECT_WA?.find(
      (r) => r.timestamp <= target - 7 * UnixTime.DAY,
    )
    if (!current || !previous || !currentWa || !previousWa) {
      continue
    }
    result[project] = { current, previous, currentWa, previousWa }
  }
  return result
}

function createTvsBreakdownProjectFilter(
  filter: TvsBreakdownProjectFilter,
): (project: Project<'statuses', 'scalingInfo' | 'isBridge'>) => boolean {
  switch (filter.type) {
    case 'projects':
      return (project) => filter.projectIds.includes(project.id)
    case 'all':
      return () => true
    case 'layer2':
      return (project) => !!project.scalingInfo
    case 'bridge':
      return (project) => !!project.isBridge
  }
}
async function getMockTvsBreakdownData(): Promise<SevenDayTvsBreakdown> {
  const projects = await ps.getProjects({ where: ['tvsConfig'] })
  return {
    total: 1000,
    projects: Object.fromEntries(
      projects.map((project) => [
        project.id,
        {
          breakdown: {
            total: 60,
            canonical: 30,
            native: 20,
            external: 10,
            ether: 30,
            stablecoin: 30,
          },
          associated: {
            total: 6,
            native: 1,
            canonical: 2,
            external: 3,
          },
          change: {
            total: 0.4,
            canonical: 0.5,
            native: 0.25,
            external: 0.25,
          },
          changeExcludingAssociated: {
            total: 0.3,
            canonical: 0.4,
            native: 0.15,
            external: 0.15,
          },
        },
      ]),
    ),
  }
}
