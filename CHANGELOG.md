# Changelog

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
