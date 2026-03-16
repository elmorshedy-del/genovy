# pheval-genovy

`pheval-genovy` is a PhEval plugin that runs `Genovy DX` in disease-prioritisation mode.

It calls a running Genovy API instance, writes raw JSON results for each phenopacket, and converts
those raw results into PhEval-standard disease result outputs during post-processing.

## Expected Genovy endpoint

- `POST /api/dx/rank`

## Minimal workflow

1. Install the plugin package.
2. Point `base_url` in `config.yaml` at a reachable Genovy deployment.
3. Run:

```bash
pheval run --runner genovy --input-dir . --testdata-dir /path/to/testdata --output-dir /path/to/output
```

`testdata_dir` should contain a `phenopackets/` subdirectory.
