import { getAppLayoutProps } from 'rewrite/src/common/getAppLayoutProps'
import { getMetadata } from 'rewrite/src/ssr/head/getMetadata'
import type { RenderData } from 'rewrite/src/ssr/types'
import { getEcosystemEntry } from '~/server/features/ecosystems/get-ecosystem-entry'
import { getExpressHelpers } from '~/trpc/server'
import type { Manifest } from '~/utils/Manifest'

export async function getEcosystemProjectData(
  manifest: Manifest,
  slug: string,
  url: string,
): Promise<RenderData | undefined> {
  const helpers = getExpressHelpers()
  const [appLayoutProps, ecosystem] = await Promise.all([
    getAppLayoutProps(),
    getEcosystemEntry(slug),
  ])

  if (!ecosystem) {
    return undefined
  }

  await Promise.all([
    helpers.tvs.chart.prefetch({
      range: '1y',
      excludeAssociatedTokens: false,
      filter: {
        type: 'projects',
        projectIds: ecosystem.projects.map((project) => project.id),
      },
    }),
    helpers.activity.chart.prefetch({
      range: '1y',
      filter: {
        type: 'projects',
        projectIds: ecosystem.projects.map((project) => project.id),
      },
    }),
  ])

  return {
    head: {
      manifest,
      metadata: getMetadata(manifest, {
        title: `${ecosystem.name} - L2BEAT`,
        openGraph: {
          url,
        },
      }),
    },
    ssr: {
      page: 'EcosystemProjectPage',
      props: {
        ...appLayoutProps,
        ecosystem,
        queryState: helpers.dehydrate(),
      },
    },
  }
}
