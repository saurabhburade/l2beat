import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { layer2s } from '@l2beat/config/src/processing/layer2s'

const outputRoot = path.resolve('packages/blobs-guru-raw-data/data/projects')

async function saveJson(relativePath: string, value: unknown) {
  const filePath = path.join(outputRoot, relativePath)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(value))
}

async function main() {
  await Promise.all([
    rm(path.join(outputRoot, 'layer2s'), { recursive: true, force: true }),
    rm(path.join(outputRoot, 'with-da-id'), { recursive: true, force: true }),
  ])

  for (const layer2 of layer2s) {
    console.log('Generating L2 metadata:', layer2.id)
    await saveJson(`layer2s/${layer2.id}.json`, layer2)

    for (const tracking of layer2.config?.daTracking ?? []) {
      if (tracking.type === 'ethereum') {
        for (const sequencer of tracking.sequencers ?? []) {
          await saveJson(
            `with-da-id/${tracking.daLayer}/${tracking.type}/${sequencer.toLowerCase()}.json`,
            layer2,
          )
        }
      }

      if (tracking.type === 'avail') {
        for (const appId of tracking.appIds ?? []) {
          await saveJson(
            `with-da-id/${tracking.daLayer}/${tracking.type}/${appId.toLowerCase()}.json`,
            layer2,
          )
        }
      }

      if (tracking.type === 'celestia' && tracking.namespace) {
        await saveJson(
          `with-da-id/${tracking.daLayer}/${tracking.type}/${tracking.namespace.toLowerCase()}.json`,
          layer2,
        )
      }

      if (tracking.type === 'eigen-da' && tracking.customerId) {
        await saveJson(
          `with-da-id/${tracking.daLayer}/${tracking.type}/${tracking.customerId.toLowerCase()}.json`,
          layer2,
        )
      }
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
