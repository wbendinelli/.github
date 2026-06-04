# Mantendo os reusable workflows

Os repos `sapians-*` referenciam os workflows como `@main` — então **toda mudança em `main` deste repo afeta os 6 repos imediatamente**. Trate com o mesmo cuidado de uma lib publicada.

## Testar uma mudança antes do merge

Workflows `workflow_call` não rodam sozinhos — só quando chamados. Pra testar:

1. Abra um branch aqui (ex.: `fix/ci-node-cache`).
2. Num repo consumidor, aponte temporariamente o caller pro seu branch:
   ```yaml
   uses: wbendinelli/.github/.github/workflows/ci-node.yml@fix/ci-node-cache
   ```
3. Abra um PR no consumidor (ou `gh workflow run` se o CI dele for push-only) → valide verde.
4. Reverta o caller pra `@main`, mergeie a mudança aqui, e o consumidor volta a pegar `@main`.

`actionlint` (workflow `lint.yml`) valida sintaxe/expressões/shellcheck em todo PR aqui — é o gate anti-quebra.

## Versionamento

- Os reusables usam `@main` (sempre o último) — **não** pinam tag. Simplicidade > pin pra um solo-dev/fleet pequeno.
- Este repo tem release-please (`simple`) só pra ter CHANGELOG + histórico — não é consumido por tag.
- **Breaking change** num reusable (ex.: trocar default do Node, remover input) → anunciar no CHANGELOG, e idealmente migrar os 6 callers no mesmo PR-trem.

## Bumps de versão de action

Centralizados. Um `actions/checkout@v6 → v7` se edita aqui (e/ou via dependabot do próprio `.github`) e propaga. Majors de risco ficam **segurados** via `ignore` no `dependabot.yml` (ex.: `release-please-action` v5, `setup-terraform` v4) pra teste deliberado.

## Princípios ao editar um reusable

- **Least-privilege:** `permissions:` mínimo no job (ex.: `contents: read`).
- **Inputs documentados:** todo input com `description` + `default`; refletir no README (Workflow Reference).
- **Custo:** `concurrency` cancel-in-progress, cache, `timeout-minutes`, guards `if: hashFiles(...)`.
- **Sem dependência de API quando dá:** ex.: gitleaks roda como binário, não como action (evita perms/licença).
