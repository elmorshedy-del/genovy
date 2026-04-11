#!/usr/bin/env bash

set -euo pipefail

ROOT="/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914"
VENV_DIR="${HOME}/.cache/genovy-azure-agent-venv"
PYTHON_BIN="${VENV_DIR}/bin/python3"

if [[ ! -x "${PYTHON_BIN}" ]]; then
  mkdir -p "$(dirname "${VENV_DIR}")"
  python3 -m venv "${VENV_DIR}"
  "${PYTHON_BIN}" -m pip install --upgrade pip >/dev/null
  "${PYTHON_BIN}" -m pip install "azure-ai-projects>=2.0.0" >/dev/null
fi

exec "${PYTHON_BIN}" "${ROOT}/src/scripts/runGroundedDiseaseLayerAzureAgent.py" "$@"
