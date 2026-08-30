# Mantendo os reusable workflows

Os repos `sapians-*` referenciam os workflows por **tag** (hoje `@v0.4.1`). Uma mudança em `main` **não** afeta ninguém até sair uma release — é a tag que é o contrato. Ainda assim, trate com o cuidado de uma lib publicada: o bump chega a todos de uma vez.

## Testar uma mudança antes do merge

Workflows `workflow_call` não rodam sozinhos — só quando chamados. Pra testar:

1. Abra um branch aqui (ex.: `fix/ci-node-cache`).
2. Num repo consumidor, aponte temporariamente o caller pro seu branch:
   ```yaml
   uses: wbendinelli/.github/.github/workflows/ci-node.yml@fix/ci-node-cache
   ```
3. Abra um PR no consumidor (ou `gh workflow run` se o CI dele for push-only) → valide verde.
4. Reverta o caller para a tag vigente, mergeie a mudança aqui, corte a release, e o Dependabot propõe o bump nos consumidores.

`actionlint` (workflow `lint.yml`) valida sintaxe/expressões/shellcheck em todo PR aqui — é o gate anti-quebra.

## Versionamento

- Os callers pinam **tag exata** (`@vX.Y.Z`), nunca `@main`. Razão: um bump em `main` chegaria a toda a frota sem aviso — é o modo de falha que a tag existe para evitar.
- O pin não vira dívida manual: o **Dependabot** já está configurado com o ecossistema `github-actions` semanalmente em todos os repos, e abre o PR de bump sozinho. Mecanismo, não disciplina.
- `sapians-xreset` pina por **SHA**, escolha mais estrita e deliberada — ao custo de não receber bump automático.
- Este repo tem release-please (`simple`) só pra ter CHANGELOG + histórico — não é consumido por tag.
- **Breaking change** num reusable (ex.: trocar default do Node, remover input) → anunciar no CHANGELOG, e idealmente migrar os 6 callers no mesmo PR-trem.

## Bumps de versão de action

Centralizados. Um `actions/checkout@v6 → v7` se edita aqui (e/ou via dependabot do próprio `.github`) e propaga. Majors de risco ficam **segurados** via `ignore` no `dependabot.yml` (ex.: `release-please-action` v5, `setup-terraform` v4) pra teste deliberado.

## Princípios ao editar um reusable

- **Least-privilege:** `permissions:` mínimo no job (ex.: `contents: read`).
- **Inputs documentados:** todo input com `description` + `default`; refletir no README (Workflow Reference).
- **Custo:** `concurrency` cancel-in-progress, cache, `timeout-minutes`, guards `if: hashFiles(...)`.
- **Sem dependência de API quando dá:** ex.: gitleaks roda como binário, não como action (evita perms/licença).
