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
- Dependências: Dependabot semanal + auto-merge de patch/minor em CI verde.
