# Política de Segurança — SAPIANS

Herdada org-wide via `wbendinelli/.github`.

## Reportar uma vulnerabilidade

Não abra issue pública. Reporte por e-mail a **wbendinelli@gmail.com** com:
descrição, passos de reprodução e impacto. Resposta esperada em até 72h.

## Padrões

- **Secrets nunca em git.** gitleaks roda no CI (`security.yml`) em todos os repos.
  Segredos vivem em GH Actions Secrets / Vercel / GCP Secret Manager / 1Password.
- **Deploy via OIDC** (Workload Identity Federation / Vercel OIDC) — sem chaves long-lived em repo. *(em rollout)*
- **Push protection** + secret scanning do GitHub habilitados.
- Dependências: Dependabot semanal + auto-merge de patch/minor em CI verde. Majors de risco segurados via `ignore` (teste deliberado).
- **SAST** (CodeQL/Semgrep) só nos repos que tocam dados de usuário (xreset, api).

## Workflows seguros (para mantenedores)

- **Least-privilege:** `permissions:` mínimo por job (ex.: `contents: read`); só `release-please` precisa de `contents: write` + `pull-requests: write`.
- **Pin de actions:** usar versão major fixa (`@v6`), nunca `@main`/`@latest` de terceiros. Dependabot (`github-actions`) mantém os bumps.
- **`secrets: inherit`** só pra reusables confiáveis (os deste repo). Reusables não logam secrets.
- **Sem dependência de API quando dá:** gitleaks roda como binário (não a action) — evita perms/licença e superfície de ataque.
- **gitleaks** varre todo o histórico (`full-history: true`); baseline em [`docs/gitleaks-baseline.md`](./docs/gitleaks-baseline.md).
- Reusables rodam em todos os 6 repos — **revisar mudança de workflow com o mesmo rigor de código de produção**.
