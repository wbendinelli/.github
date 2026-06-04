# .github — SAPIANS golden path (config central)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

> **Tier:** `D` · **Classe:** `Docs/Config`

## O que é / Por quê

Repositório **central de engenharia** dos repos `sapians-*` (sob a conta `wbendinelli`).
Hospeda os **reusable workflows** (`workflow_call`) que cada repo chama em ~12 linhas,
os **community health files** herdados org-wide, e os **templates** do golden path.

É a fonte única de CI/CD: bumpar uma versão de action aqui propaga a todos os repos.
Documentação humana do padrão vive no handbook em `sapians-platform`.

## Reusable workflows

| Workflow | Para | Gates |
|---|---|---|
| `ci-node.yml` | Apps/Libs TS (pnpm + Biome) | lint · typecheck · build · test (bloqueiam) |
| `ci-python.yml` | Serviços Python (ruff + mypy + pytest) | ruff bloqueia · mypy/pytest report→block (ratchet) |
| `ci-terraform.yml` | IaC | fmt · validate · tflint · checkov (bloqueiam) |
| `security.yml` | Todos | gitleaks (secret scan) |

### Como um repo chama (Quickstart)

```yaml
# .github/workflows/ci.yml no repo consumidor
name: CI
on:
  push: { branches: [main], paths-ignore: ["**.md"] }
  workflow_dispatch: {}
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }
jobs:
  ci:
    uses: wbendinelli/.github/.github/workflows/ci-node.yml@main
    permissions: { contents: read, packages: read }
    with: { node-version: "22", pnpm-version: "9.15.9", run-build: true }
    secrets: inherit
```

## Toolchain pinado (golden path)

| Tool | Versão |
|---|---|
| Node | 22 |
| pnpm | 9.15.9 |
| Python | 3.12 |
| Actions | checkout@v6 · setup-node@v6 · setup-python@v5 · pnpm/action-setup@v6 |

## Status

Fase 1 do golden path (implementação de referência: xreset · api · docs · corpus · infra · platform).

## Links

- Handbook do golden path: `sapians-platform` (handbook/)
- Template de README: [`templates/README.template.md`](./templates/README.template.md)
