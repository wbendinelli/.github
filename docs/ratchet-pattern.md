# Ratchet pattern (report → block)

Gates novos não nascem bloqueantes num repo com débito. O **ratchet** deixa o gate rodar como **report** (não falha o CI) na adoção e o aperta pra **block** quando o repo está limpo — e nunca afrouxa.

## Onde se aplica

| Gate | Reusable | Input | Adoção | Apertar |
|---|---|---|---|---|
| mypy | `ci-python` | `mypy-blocking` | `false` (report) | `true` quando a tipagem do módulo passa |
| pytest | `ci-python` | `pytest-blocking` | `false` | `true` quando os de integração estão marcados |
| fmt/tflint/checkov | `ci-terraform` | `strict` | `false` (report) | `true` quando fmt limpo + achados resolvidos |
| coverage | (futuro) | threshold | report | threshold que só sobe |

`ruff` (python), `validate` (terraform), lint/typecheck/build/test (node) e secret-scan **já nascem bloqueantes** — são determinísticos e baratos de manter limpos.

## Regras

1. **Report é estado temporário e documentado**, nunca permanente. Cada gate em report deve ter um motivo + plano de apertar.
2. **O threshold só sobe.** Nunca relaxar um gate que já bloqueia.
3. **Apertar por módulo/área** quando dá (ex.: mypy strict por pacote), pra avançar sem big-bang.

## Exemplo — apertar o mypy do api

1. Limpar a tipagem de um módulo (ex.: `api/app/core`).
2. Adicionar o módulo ao `disallow_untyped_defs` no `pyproject.toml`.
3. Quando o serviço todo passa, no caller do api: `mypy-blocking: true`.
