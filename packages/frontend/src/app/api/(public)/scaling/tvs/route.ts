import { UnixTime } from '@l2beat/shared-pure'
import { unstable_cache as cache } from 'next/cache'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  TvsChartDataParams,
  getTvsChart,
} from '~/server/features/scaling/tvs/get-tvs-chart-data'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const range = searchParams.get('range') as TvsChartDataParams['range'] | null
  const type = searchParams.get('type') as
    | TvsChartDataParams['filter']['type']
    | null
  const projectIds = searchParams.get('projectIds')

  if (type === 'projects' && !projectIds) {
    return NextResponse.json({
      success: false,
      errors: [{ message: 'projectIds is required for "projects" type' }],
    })
  }

  const params: TvsChartDataParams = {
    range: range ?? '30d',
    filter:
      type === 'projects'
        ? {
            type: 'projects',
            projectIds: projectIds?.split(',') ?? [],
          }
        : { type: type ?? 'layer2' },
    excludeAssociatedTokens:
      searchParams.get('excludeAssociatedTokens') === 'true',
    previewRecategorisation: false,
  }

  const parsedParams = TvsChartDataParams.safeParse(params)
  if (parsedParams.error) {
    return NextResponse.json({
      success: false,
      errors: parsedParams.error.errors,
    })
  }

  const response = await getCachedResponse(parsedParams.data)

  return NextResponse.json(response)
}

const getCachedResponse = cache(
  async (params: TvsChartDataParams) => {
    const data = await getTvsChart(params)

    const latestTvsData = data.at(-1)

    if (!latestTvsData) {
      return {
        success: false,
        error: 'Missing data.',
      } as const
    }

    const usdValue = latestTvsData[1] + latestTvsData[2] + latestTvsData[3]
    const ethValue = usdValue / latestTvsData[4]

    return {
      success: true,
      data: {
        usdValue,
        ethValue,
        chart: {
          types: ['timestamp', 'native', 'canonical', 'external', 'ethPrice'],
          data: data.map(
            ([timestamp, native, canonical, external, ethPrice]) => [
              timestamp,
              native,
              canonical,
              external,
              ethPrice,
            ],
          ),
        },
      },
    } as const
  },
  ['scaling-tvs-route'],
  {
    tags: ['hourly-data'],
    revalidate: UnixTime.HOUR,
  },
)
