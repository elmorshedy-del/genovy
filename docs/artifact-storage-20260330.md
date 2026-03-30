# Artifact Storage

Generated artifacts were archived to Google Cloud Storage under:

- `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/output/`
- `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/downloads-files-4/`

What belongs in GitHub:

- source code in `src/`
- small policy/config files in `data/source-enrichment/`
- docs and prompt specs in `docs/`

What belongs in cloud storage:

- generated pipeline outputs under `output/`
- cached chapter HTML/text/table files
- pilot run folders copied from `/Users/ahmedelmorshedy/Downloads/files (4)/`
- large manifests and intermediate stage artifacts

Local retention rule:

- keep only the currently active run folder needed for review
- delete older generated artifacts after cloud verification
