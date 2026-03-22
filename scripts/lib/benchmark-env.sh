#!/usr/bin/env bash

resolve_genovy_output_dir() {
  local root_dir="$1"
  local default_output_dir="$root_dir/output"
  local sibling_repo_output_dir

  sibling_repo_output_dir="$(cd "$root_dir/.." && pwd)/Genovy/output"

  if [[ -n "${GENOVY_OUTPUT_DIR:-}" ]]; then
    printf '%s\n' "$GENOVY_OUTPUT_DIR"
    return 0
  fi

  if [[ -d "$default_output_dir/pheval-official-sample-100/phenopackets" ]]; then
    printf '%s\n' "$default_output_dir"
    return 0
  fi

  if [[ -d "$sibling_repo_output_dir/pheval-official-sample-100/phenopackets" ]]; then
    printf '%s\n' "$sibling_repo_output_dir"
    return 0
  fi

  printf '%s\n' "$default_output_dir"
}

resolve_node_bin() {
  if [[ -n "${NODE_BIN:-}" ]]; then
    printf '%s\n' "$NODE_BIN"
    return 0
  fi

  if [[ -n "${npm_node_execpath:-}" ]]; then
    printf '%s\n' "$npm_node_execpath"
    return 0
  fi

  if command -v node >/dev/null 2>&1; then
    command -v node
    return 0
  fi

  if [[ -x "$HOME/.nvm/versions/node/v22.22.0/bin/node" ]]; then
    printf '%s\n' "$HOME/.nvm/versions/node/v22.22.0/bin/node"
    return 0
  fi

  echo "Unable to locate a node executable. Export NODE_BIN or run via npm." >&2
  return 1
}
