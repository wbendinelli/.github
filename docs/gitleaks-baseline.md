# gitleaks — baseline & customização

O `security.yml` roda o **binário** gitleaks (não a `gitleaks-action`) — least-privilege (`contents: read`), sem chamadas de API, sem licença de org.

## Baseline embutido

Quando o repo **não** tem `.gitleaks.toml` próprio, o workflow aplica um baseline com:
- `[extend] useDefault = true` (todas as regras default do gitleaks).
- Allowlist de arquivos de exemplo/template (placeholders, não segredos):
  `*.env.example`, `*.sample`, `*.template`, `*.example`.

Isso evita o falso-positivo clássico (`JWT_SECRET=` vazio em `.env.example` casando `generic-api-key`).

## Customizar por repo

Crie `.gitleaks.toml` na raiz do repo — ele tem **precedência** sobre o baseline:

```toml
title = "REPO gitleaks"
[extend]
useDefault = true
[allowlist]
description = "Exceções específicas do repo"
paths = [
  '''(^|/)fixtures/.*\.json$''',
]
# regexes = ['''AKIA[0-9A-Z]{16}'''']  # ex.: allowlistar um padrão específico
```

## Se gitleaks achar um segredo REAL

1. **Rotacionar** o segredo imediatamente (não basta remover do git).
2. Remover do código; mover pra GH Actions Secrets / Vercel / GCP Secret Manager / 1Password.
3. Se estava no histórico, considerar reescrever o histórico (`git filter-repo`) — coordenar.

## Defesa em profundidade

Onde já existe **GitGuardian** (ex.: sapians-api), os dois rodam em paralelo — gitleaks no CI (gate versionado) + GitGuardian (app). Manter ambos.
