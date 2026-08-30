# Changelog

## [0.6.0](https://github.com/wbendinelli/.github/compare/v0.5.0...v0.6.0) (2026-08-30)


### Features

* **onboarding:** gerador de repositório conforme, e o README para de mentir ([#19](https://github.com/wbendinelli/.github/issues/19)) ([cd0d394](https://github.com/wbendinelli/.github/commit/cd0d394054dfde15400eb5c2978a912f68bb4fb0))


### Bug Fixes

* **brand:** uma definição do marcador de exceção, honrada pelas duas ferramentas ([#17](https://github.com/wbendinelli/.github/issues/17)) ([44e1c64](https://github.com/wbendinelli/.github/commit/44e1c640749162978c71e81a3daae8110eabc159))

## [0.5.0](https://github.com/wbendinelli/.github/compare/v0.4.1...v0.5.0) (2026-08-30)


### Features

* **brand-lint:** read the canonical rule and allow deliberate citations ([5b1e73e](https://github.com/wbendinelli/.github/commit/5b1e73e69edf9182c43330eb610dc46f0f96944e))


### Documentation

* correct the pinning examples and the false fleet state ([232c7fa](https://github.com/wbendinelli/.github/commit/232c7fa1fb1cb769fb405d71ee2af4b6c9b730bb))
* state the real pinning policy — tag, not [@main](https://github.com/main) ([471a45e](https://github.com/wbendinelli/.github/commit/471a45e3f39e3487d0d75b26e33b18355b1c5142))


### Code Refactoring

* **ci:** run the canonical brand-lint script instead of an inline copy ([d1c4087](https://github.com/wbendinelli/.github/commit/d1c4087ff51f45f8365c8b427024ad2d9f0c873d))

## [0.4.1](https://github.com/wbendinelli/.github/compare/v0.4.0...v0.4.1) (2026-08-30)


### Bug Fixes

* **release:** drop separate-pull-requests, the cause of silently discarded releases ([4499ce5](https://github.com/wbendinelli/.github/commit/4499ce569b110da9df32796d85741e3bd8c8280b))


### Documentation

* replace the false release-please explanation with the proven cause ([a048329](https://github.com/wbendinelli/.github/commit/a048329632fba2997f4582f613ae8f1eccbd9c80))

## [0.4.0](https://github.com/wbendinelli/.github/compare/v0.3.0...v0.4.0) (2026-08-30)


### Features

* **ci:** add reusable docs-lint workflow ([4b28d84](https://github.com/wbendinelli/.github/commit/4b28d84ed2ca99a79785c69898e8851b85dfe6d3))
* **doclint:** add documentation gate with per-repo baseline (ADR-0015) ([f815617](https://github.com/wbendinelli/.github/commit/f815617ac34aaa48729af4c737260d89dd77eda0))
* **doclint:** add profiles, tier matrix and severities ([2636787](https://github.com/wbendinelli/.github/commit/26367870f30ebe847792cfac80bd2ff9ee4426b8))
* **doclint:** canonical brand rule, single source for the three copies ([aba5943](https://github.com/wbendinelli/.github/commit/aba59438a9b66890b48e51f9692a919d090fc5de))
* **doclint:** match sections by canonical prefix, widen aliases from real fleet usage ([906088d](https://github.com/wbendinelli/.github/commit/906088dd5cf4b4861b48a5c414c67bde37a72dda))
* **doclint:** match sections by canonical prefix, widen aliases from real fleet usage ([fc0f14f](https://github.com/wbendinelli/.github/commit/fc0f14f0a2c80309a360a5e65b013da58dc6c601))


### Bug Fixes

* **ci:** checkout the config repo instead of relying on job_workflow_sha ([400621f](https://github.com/wbendinelli/.github/commit/400621fe6ce276a9d2118fc5939bebfcad34ffc7))
* **doclint:** read section bodies from the original text ([93a6939](https://github.com/wbendinelli/.github/commit/93a6939dda45a8299646fe033e124173a5bad4df))
* **doclint:** realign profiles to the Google docguide baseline ([c516e13](https://github.com/wbendinelli/.github/commit/c516e1344ef5f502051d294463180d6323db112e))
* **release:** remove package-name que impedia o tagging pós-merge ([44ae6f6](https://github.com/wbendinelli/.github/commit/44ae6f6982ac9a09a47c274941b7992f95d3d38c))


### Documentation

* conform README to the config profile (ADR-0015) ([6c4bb44](https://github.com/wbendinelli/.github/commit/6c4bb44c6ed3f0355843a5ac587479e713cf53cd))
* **templates:** add client.template.md profile (ADR-0015) ([a329267](https://github.com/wbendinelli/.github/commit/a329267c78fe7dea1736922f00ec426e04fb5807))
* **templates:** add config.template.md profile (ADR-0015) ([ba00c79](https://github.com/wbendinelli/.github/commit/ba00c79377e8aa9350bfcf524b751cff16553991))
* **templates:** add content.template.md profile (ADR-0015) ([2f9e6a3](https://github.com/wbendinelli/.github/commit/2f9e6a33e03de7ad382d5ceb16680e02b0e8909b))
* **templates:** add product.template.md profile (ADR-0015) ([8e94e12](https://github.com/wbendinelli/.github/commit/8e94e12aaf770ca3cf82e85a2ca838dfdf228c1a))
* **templates:** add research.template.md profile (ADR-0015) ([8e5937b](https://github.com/wbendinelli/.github/commit/8e5937b11472b8066f1eb39d674341ac1b25e3ab))


### Continuous Integration

* run doclint against this repository itself ([761601f](https://github.com/wbendinelli/.github/commit/761601fb344160588320bc3bd154025fd43317da))

## [0.3.0](https://github.com/wbendinelli/.github/compare/v0.2.2...v0.3.0) (2026-08-25)


### Features

* **ci-python-uv:** add lean reusable CI for uv-only Python repos ([db9eb38](https://github.com/wbendinelli/.github/commit/db9eb387274242a958fb0555718d5a72c8468a1b))
* **ci-python:** suporte a uv (use-uv) preservando o caminho pip ([#11](https://github.com/wbendinelli/.github/issues/11)) ([e07c182](https://github.com/wbendinelli/.github/commit/e07c1828e1756d5c2179f4bb019625abcd3f0829))
* **ci-terraform:** input strict-fmt (degrau do ratchet) preservando default ([#13](https://github.com/wbendinelli/.github/issues/13)) ([3d97214](https://github.com/wbendinelli/.github/commit/3d97214bd892724263df7695d94b5f1432a5060d))


### Documentation

* **architecture:** registra classe ClientDelivery (tier D) ([7c7ca6b](https://github.com/wbendinelli/.github/commit/7c7ca6bc3149c0a3a50badb9b1e96e88436017e9))
* **readme:** document ci-python-uv.yml and the per-tier CI contract ([3fe3a99](https://github.com/wbendinelli/.github/commit/3fe3a99e608f1a4bce689d1882b59fb8fa19474b))

## [0.2.2](https://github.com/wbendinelli/.github/compare/v0.2.1...v0.2.2) (2026-06-04)


### Documentation

* **troubleshooting:** v5 testado, não resolve o auto-cut ([7a3ac8d](https://github.com/wbendinelli/.github/commit/7a3ac8de17aaa587c1ebc8e69c44af2b7a4a0e02))

## [0.2.1](https://github.com/wbendinelli/.github/compare/v0.2.0...v0.2.1) (2026-06-04)


### Documentation

* SOTA do .github — workflow reference, onboarding, docs/, MAINTAINERS ([#7](https://github.com/wbendinelli/.github/issues/7)) ([b2fcd26](https://github.com/wbendinelli/.github/commit/b2fcd26706afcc3399d8a6977746655678dc2025))


### Continuous Integration

* test release-please-action v5 (corrigir auto-cut da release) ([#9](https://github.com/wbendinelli/.github/issues/9)) ([bafe508](https://github.com/wbendinelli/.github/commit/bafe508c6734d623f906b3c70f196d2461a8590e))

## [0.2.0](https://github.com/wbendinelli/.github/compare/v0.1.1...v0.2.0) (2026-06-04)


### Features

* **brand:** brand-lint guardrail + fixer (SAPIANS uppercase) ([#5](https://github.com/wbendinelli/.github/issues/5)) ([e4791f8](https://github.com/wbendinelli/.github/commit/e4791f81c8161b3a474a7bf237a9d4d05545db30))

## [0.1.1](https://github.com/wbendinelli/.github/compare/v0.1.0...v0.1.1) (2026-06-04)


### Bug Fixes

* **security:** baseline gitleaks allowlist for example/template files ([9c63d47](https://github.com/wbendinelli/.github/commit/9c63d4769deab40cf6ea2c0dc4d91ffaebc9e122))
* **security:** disable gitleaks PR comments + fix fetch-depth expression ([31875f3](https://github.com/wbendinelli/.github/commit/31875f3067e8b112a755e827228e05b4ead62056))
* **security:** run gitleaks binary directly instead of gitleaks-action ([a546a72](https://github.com/wbendinelli/.github/commit/a546a72823192be700308fed16224301d01d46b8))


### Continuous Integration

* add reusable release-please workflow ([f0e4718](https://github.com/wbendinelli/.github/commit/f0e471872836d539419c1c1f27259fbceaabad02))
* add strict/ratchet knob to ci-terraform (validate always blocks) ([4a2c96a](https://github.com/wbendinelli/.github/commit/4a2c96a78bbc6b6c11aab1ecf451d831f690bcbd))
* bring .github repo to SOTA — actionlint, release-please, dependabot ([#1](https://github.com/wbendinelli/.github/issues/1)) ([024068c](https://github.com/wbendinelli/.github/commit/024068c3a464989d765712018e1278203978bc28))
* golden path central — reusable workflows + community health ([f2b16f4](https://github.com/wbendinelli/.github/commit/f2b16f487ce1468f4633e15c1ebe7555f335a42f))
