# Arquitetura do golden path

Como os 6 repos `sapians-*` consomem a config central deste `.github`.

```mermaid
flowchart LR
    subgraph GH[".github (config central)"]
      RN[ci-node]
      RP[ci-python]
      RT[ci-terraform]
      SEC[security]
      BL[brand-lint]
      REL[release-please]
      CFG[@sapians/docs-config<br/>biome + tsconfig base]
    end

    subgraph Repos["repos sapians-*"]
      X[xreset · App]
      A[api · Service]
      D[docs · Lib monorepo]
      I[infra · IaC]
      C[corpus · Content]
      PL[platform · Docs/handbook]
    end

    X & D -->|uses| RN
    A -->|uses| RP
    I -->|uses| RT
    X & A & D & I & C & PL -->|uses| SEC
    X & A & D & I & C & PL -->|uses| BL
    X & A & D & I & C & PL -->|uses| REL
    X & D -.->|extends| CFG
    PL -.->|documenta o porquê| GH
```

## Camadas

- **`.github`** = a camada executável do padrão (CI/CD, security, brand, release).
- **`sapians-platform/handbook/golden-path.md`** = a camada humana (o porquê, tiers, decisões/ADRs).
- **`@sapians/docs-config`** (em `sapians-docs/packages/config`) = config compartilhada de toolchain (tsconfig base, biome base) — consumida via `extends`.

## Fluxo de um PR

1. PR aberto → o caller do repo chama os reusables (CI do tier + security + brand-lint).
2. Gates bloqueantes verdes → merge em `main`.
3. `main` → `release-please` abre/atualiza o PR de release (bump + CHANGELOG por conventional commits).
4. Merge do PR de release → tag + GitHub Release (ver nudge em [troubleshooting](./troubleshooting.md#release-please)).
5. Deploy/publish (Vercel, Cloud Run, GH Packages) — **fora do escopo** do `.github`.

## Tiers (resumo — detalhe no handbook)

| Tier | Classe | CI |
|---|---|---|
| A | App/Service | lint·typecheck·build·test·security·brand |
| B | Library | lint·typecheck·test·publish |
| I | IaC | fmt·validate·tflint·checkov·security |
| C | Content | schema-validate·security·brand |
| D | Docs | security·brand (leve) |
| D | ClientDelivery | security·brand — projeto de entrega de cliente (scaffold: [`sapians-client-template`](https://github.com/wbendinelli/sapians-client-template)) |
