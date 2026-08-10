# Generated chain metadata

This package exports machine-readable chain and data-availability metadata from
the current `@l2beat/config` workspace package. It deliberately contains no
forked copy of L2BEAT configuration source, so upstream syncs remain isolated
from the generated output.

## Outputs

- `data/projects/layer2s`: one complete JSON document per L2 project
- `data/projects/da`: one JSON document per data-availability layer
- `data/projects/with-da-id`: L2 metadata indexed by DA tracking identifier

## Commands

Run these commands from the repository root after building config dependencies:

```bash
pnpm build:dependencies:config
pnpm --filter @l2beat/blobs-guru-raw-data layer2-details-full
pnpm --filter @l2beat/blobs-guru-raw-data DA-details-full
```

The scheduled GitHub Actions workflow runs the same commands and opens an
`automerge` pull request when the generated files change.
