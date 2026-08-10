import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { DA_LAYERS } from '@l2beat/config/src/common'

const outputDirectory = path.resolve(
  'packages/blobs-guru-raw-data/data/projects/da',
)

async function main() {
  await rm(outputDirectory, { recursive: true, force: true })
  await mkdir(outputDirectory, { recursive: true })

  for (const [id, layer] of Object.entries(DA_LAYERS)) {
    console.log('Generating DA metadata:', id)
    await writeFile(
      path.join(outputDirectory, `${id}.json`),
      JSON.stringify(layer),
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
