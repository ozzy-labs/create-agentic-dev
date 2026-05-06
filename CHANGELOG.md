# Changelog

## [0.2.4](https://github.com/ozzy-labs/create-agentic-app/compare/create-agentic-app-v0.2.3...create-agentic-app-v0.2.4) (2026-05-06)


### Bug Fixes

* align inline comments in .mise.toml to satisfy taplo format ([#247](https://github.com/ozzy-labs/create-agentic-app/issues/247)) ([100b674](https://github.com/ozzy-labs/create-agentic-app/commit/100b674af49cc680d704fba19461f33159772192))
* **skills:** add missing skills_commit and skills_adapters to sync.yaml ([#243](https://github.com/ozzy-labs/create-agentic-app/issues/243)) ([4ab91a0](https://github.com/ozzy-labs/create-agentic-app/commit/4ab91a02234827494e5b8ca928173cc202d3254a))

## [0.2.3](https://github.com/ozzy-labs/create-agentic-app/compare/create-agentic-app-v0.2.2...create-agentic-app-v0.2.3) (2026-04-26)


### Bug Fixes

* update pinned action versions to match project workflows ([#235](https://github.com/ozzy-labs/create-agentic-app/issues/235)) ([40b19fb](https://github.com/ozzy-labs/create-agentic-app/commit/40b19fb8d041052650e33de0007f94119e14cc36))

## [0.2.2](https://github.com/ozzy-labs/create-agentic-app/compare/create-agentic-app-v0.2.1...create-agentic-app-v0.2.2) (2026-04-26)


### Features

* add library preset for npm package scaffolds (Phase 1) ([#223](https://github.com/ozzy-labs/create-agentic-app/issues/223)) ([5b60ed8](https://github.com/ozzy-labs/create-agentic-app/commit/5b60ed884fd7a3caf9f8b4cca235f6242e51bde2))
* **skills-sync:** migrate to adapter-aware sync via @ozzylabs/skills ([#225](https://github.com/ozzy-labs/create-agentic-app/issues/225)) ([0250595](https://github.com/ozzy-labs/create-agentic-app/commit/0250595898e695b320982561a21a0c59be767f80))
* **skills-sync:** opt-in @ozzylabs/skills as PoC consumer ([#217](https://github.com/ozzy-labs/create-agentic-app/issues/217)) ([3d600ed](https://github.com/ozzy-labs/create-agentic-app/commit/3d600ede1c1e8dc606b5e1cb788e461caffd5c69))
* support external preset packages via dynamic import ([#212](https://github.com/ozzy-labs/create-agentic-app/issues/212)) ([03fb284](https://github.com/ozzy-labs/create-agentic-app/commit/03fb284448a1982a4e32287397913019734d977a))


### Bug Fixes

* **security:** override vulnerable postcss ([#229](https://github.com/ozzy-labs/create-agentic-app/issues/229)) ([5d2b38f](https://github.com/ozzy-labs/create-agentic-app/commit/5d2b38f24c89f7db29b761d11bb1da2a187394fb)), closes [#228](https://github.com/ozzy-labs/create-agentic-app/issues/228)
* **skills-sync:** update skills_commit to adapter-structured dist ([#233](https://github.com/ozzy-labs/create-agentic-app/issues/233)) ([bf689d1](https://github.com/ozzy-labs/create-agentic-app/commit/bf689d1078538f5e28565641d992a04dadfe353b))

## [0.2.1](https://github.com/ozzy-labs/create-agentic-dev/compare/create-agentic-app-v0.2.0...create-agentic-app-v0.2.1) (2026-04-20)


### Bug Fixes

* **ci:** disable trivy in release workflow mise-action ([#209](https://github.com/ozzy-labs/create-agentic-dev/issues/209)) ([bbd12fb](https://github.com/ozzy-labs/create-agentic-dev/commit/bbd12fb8d7341038e84a7e5deeb5d0df087656bb))

## [0.2.0](https://github.com/ozzy-labs/create-agentic-dev/compare/create-agentic-app-v0.1.2...create-agentic-app-v0.2.0) (2026-04-20)


### ⚠ BREAKING CHANGES

* rename package to @ozzylabs/create-agentic-app ([#207](https://github.com/ozzy-labs/create-agentic-dev/issues/207))

### Features

* add --apply mode for agent setup on existing projects ([#184](https://github.com/ozzy-labs/create-agentic-dev/issues/184)) ([3355bf4](https://github.com/ozzy-labs/create-agentic-dev/commit/3355bf40d18d88e7772d4f849e483feb4fee23c5)), closes [#176](https://github.com/ozzy-labs/create-agentic-dev/issues/176)
* add --dry-run preview and post-generation auto-setup ([#131](https://github.com/ozzy-labs/create-agentic-dev/issues/131)) ([066a059](https://github.com/ozzy-labs/create-agentic-dev/commit/066a059a63536e21ac55d190504b01cfcfd3af17))
* add /drive skill for end-to-end autonomous implementation ([#111](https://github.com/ozzy-labs/create-agentic-dev/issues/111)) ([4b3fd17](https://github.com/ozzy-labs/create-agentic-dev/commit/4b3fd171f2cd860f08aad7216d3ff05aaffdce76))
* add Amazon Q Developer preset ([#100](https://github.com/ozzy-labs/create-agentic-dev/issues/100)) ([161ab93](https://github.com/ozzy-labs/create-agentic-dev/commit/161ab93c93f150e9b911efd6de5b4c323e2e9cb1)), closes [#94](https://github.com/ozzy-labs/create-agentic-dev/issues/94)
* add Azure Bicep preset as IaC option ([#47](https://github.com/ozzy-labs/create-agentic-dev/issues/47)) ([3dd4a9c](https://github.com/ozzy-labs/create-agentic-dev/commit/3dd4a9c7c871825eed8746828c220bc7040b805a))
* add Backend layer and reorder wizard to app-first flow ([#81](https://github.com/ozzy-labs/create-agentic-dev/issues/81)) ([2bd387c](https://github.com/ozzy-labs/create-agentic-dev/commit/2bd387ce1b68685c99edd7d63acc40d84a0822ae))
* add CDK, CloudFormation, and Terraform presets ([#9](https://github.com/ozzy-labs/create-agentic-dev/issues/9)) ([62aad8e](https://github.com/ozzy-labs/create-agentic-dev/commit/62aad8e0f9ab612facf933657864a00f9080c8c9))
* add Cline preset ([#110](https://github.com/ozzy-labs/create-agentic-dev/issues/110)) ([84618c7](https://github.com/ozzy-labs/create-agentic-dev/commit/84618c712776805b472d24be30fb82d61c151f76))
* add cloud provider selection and make IaC multi-select ([#48](https://github.com/ozzy-labs/create-agentic-dev/issues/48)) ([b1d1308](https://github.com/ozzy-labs/create-agentic-dev/commit/b1d13087866bfac576f5ecc88cdf1ed707787b1e))
* add Codex CLI preset ([#98](https://github.com/ozzy-labs/create-agentic-dev/issues/98)) ([70c2e3c](https://github.com/ozzy-labs/create-agentic-dev/commit/70c2e3c8fecebd261f98d80f05594760048adb78)), closes [#89](https://github.com/ozzy-labs/create-agentic-dev/issues/89)
* add core engine (types, merge, wizard, generator, base preset) ([#7](https://github.com/ozzy-labs/create-agentic-dev/issues/7)) ([c101061](https://github.com/ozzy-labs/create-agentic-dev/commit/c10106182b08a734ded2240513a15bf1d50f0575)), closes [#2](https://github.com/ozzy-labs/create-agentic-dev/issues/2)
* add Cursor preset ([#112](https://github.com/ozzy-labs/create-agentic-dev/issues/112)) ([dfeb3de](https://github.com/ozzy-labs/create-agentic-dev/commit/dfeb3de79b95b7088ec989dc630b039281fca46f)), closes [#106](https://github.com/ozzy-labs/create-agentic-dev/issues/106)
* add Express preset ([#83](https://github.com/ozzy-labs/create-agentic-dev/issues/83)) ([6b83ca3](https://github.com/ozzy-labs/create-agentic-dev/commit/6b83ca37b6c8bc9035bb41a318ab1e880246cc27))
* add FastAPI preset ([#82](https://github.com/ozzy-labs/create-agentic-dev/issues/82)) ([8d4f7a2](https://github.com/ozzy-labs/create-agentic-dev/commit/8d4f7a2a7b46183397752593be4484b21b627bf9))
* add Gemini CLI preset ([#99](https://github.com/ozzy-labs/create-agentic-dev/issues/99)) ([8788902](https://github.com/ozzy-labs/create-agentic-dev/commit/87889021c83b5b0db7e7f8db60e0f4c6eea7ddf8)), closes [#90](https://github.com/ozzy-labs/create-agentic-dev/issues/90)
* add GitHub Copilot preset ([#101](https://github.com/ozzy-labs/create-agentic-dev/issues/101)) ([11268db](https://github.com/ozzy-labs/create-agentic-dev/commit/11268dbcc112a1291751e82767a2e91003d9c450)), closes [#91](https://github.com/ozzy-labs/create-agentic-dev/issues/91)
* add Google Cloud preset ([#69](https://github.com/ozzy-labs/create-agentic-dev/issues/69)) ([166333a](https://github.com/ozzy-labs/create-agentic-dev/commit/166333aab7671183ac08f094eb74990bcf57a218))
* add i18n support with English and Japanese locales ([#39](https://github.com/ozzy-labs/create-agentic-dev/issues/39)) ([cad8a08](https://github.com/ozzy-labs/create-agentic-dev/commit/cad8a087270cc7e0381cebb797fe7798dcefccc5))
* add input validation for requires chains and IaC/cloud combos ([#121](https://github.com/ozzy-labs/create-agentic-dev/issues/121)) ([6691372](https://github.com/ozzy-labs/create-agentic-dev/commit/6691372c8818de1411ff126e06ad466791974084)), closes [#118](https://github.com/ozzy-labs/create-agentic-dev/issues/118)
* add mcpServers field to Preset interface ([#95](https://github.com/ozzy-labs/create-agentic-dev/issues/95)) ([8e7daea](https://github.com/ozzy-labs/create-agentic-dev/commit/8e7daeaa8b673a3324e743449835839ee9718422)), closes [#86](https://github.com/ozzy-labs/create-agentic-dev/issues/86)
* add multi-agent support to this repository ([#202](https://github.com/ozzy-labs/create-agentic-dev/issues/202)) ([1813701](https://github.com/ozzy-labs/create-agentic-dev/commit/18137013c3fac2e265ef863b561e60cff71d4014))
* add Next.js frontend preset ([#65](https://github.com/ozzy-labs/create-agentic-dev/issues/65)) ([a60666a](https://github.com/ozzy-labs/create-agentic-dev/commit/a60666adb58562bf04b2454c2bd98b177ed28cee))
* add snapshot tests, release workflow, and README ([#10](https://github.com/ozzy-labs/create-agentic-dev/issues/10)) ([9cffea7](https://github.com/ozzy-labs/create-agentic-dev/commit/9cffea7498ed4de7b1989f4a3730b6a498ccdfde))
* add test project generation script ([#135](https://github.com/ozzy-labs/create-agentic-dev/issues/135)) ([ad6023a](https://github.com/ozzy-labs/create-agentic-dev/commit/ad6023ac369f48e29d9e24f85a7d92770f497b1c))
* add TypeScript, Python, and React presets ([#8](https://github.com/ozzy-labs/create-agentic-dev/issues/8)) ([9bcf637](https://github.com/ozzy-labs/create-agentic-dev/commit/9bcf637c1979303980ecd5bc27aa92b9ba3b07db))
* add verification tests for generated output validation ([#46](https://github.com/ozzy-labs/create-agentic-dev/issues/46)) ([b0276f6](https://github.com/ozzy-labs/create-agentic-dev/commit/b0276f6005da3e59b6a63b24f16adc55e4887ff0)), closes [#43](https://github.com/ozzy-labs/create-agentic-dev/issues/43)
* add Vue/Nuxt and batch/worker presets ([#127](https://github.com/ozzy-labs/create-agentic-dev/issues/127)) ([d4a9dac](https://github.com/ozzy-labs/create-agentic-dev/commit/d4a9dac38507e4b1b389650e38de98b5e5a0b72b))
* make VSCode and devcontainer settings preset-aware ([#44](https://github.com/ozzy-labs/create-agentic-dev/issues/44)) ([bdc667a](https://github.com/ozzy-labs/create-agentic-dev/commit/bdc667a3df5876c60d49c032c722e816550f6451))
* **preset:** add .agents/skills/ cross-tool skills with Claude overlay ([#200](https://github.com/ozzy-labs/create-agentic-dev/issues/200)) ([7a61781](https://github.com/ozzy-labs/create-agentic-dev/commit/7a61781ef9b43f42874cc8c102009439a3401ae4)), closes [#196](https://github.com/ozzy-labs/create-agentic-dev/issues/196)
* **preset:** add Hono backend preset ([#182](https://github.com/ozzy-labs/create-agentic-dev/issues/182)) ([295c875](https://github.com/ozzy-labs/create-agentic-dev/commit/295c87520b8382a636163308ba5a26484870708f)), closes [#181](https://github.com/ozzy-labs/create-agentic-dev/issues/181)
* **preset:** add Playwright E2E testing preset with Testing layer ([#185](https://github.com/ozzy-labs/create-agentic-dev/issues/185)) ([2346ec7](https://github.com/ozzy-labs/create-agentic-dev/commit/2346ec786d0c1d151b0e372914202ddd6ade7c8e)), closes [#175](https://github.com/ozzy-labs/create-agentic-dev/issues/175)
* **preset:** add SvelteKit and Astro frontend presets ([#183](https://github.com/ozzy-labs/create-agentic-dev/issues/183)) ([089231a](https://github.com/ozzy-labs/create-agentic-dev/commit/089231ab349d27465d93e92921cbeb66810c7eb1)), closes [#180](https://github.com/ozzy-labs/create-agentic-dev/issues/180)
* **preset:** add Trivy security scanning ([#171](https://github.com/ozzy-labs/create-agentic-dev/issues/171)) ([74dd1cf](https://github.com/ozzy-labs/create-agentic-dev/commit/74dd1cf0188448d1fb70d17e16b5c3f492c3e820)), closes [#166](https://github.com/ozzy-labs/create-agentic-dev/issues/166)
* **preset:** install agent CLIs via mise ([#201](https://github.com/ozzy-labs/create-agentic-dev/issues/201)) ([a113982](https://github.com/ozzy-labs/create-agentic-dev/commit/a1139826ede5c5a28223dfa43540b911ab94c070))
* **preset:** migrate to AGENTS.md SSOT with slim CLAUDE.md ([#198](https://github.com/ozzy-labs/create-agentic-dev/issues/198)) ([3378a87](https://github.com/ozzy-labs/create-agentic-dev/commit/3378a8729e4d7ae8e9fe3d2ecfb0828ef5bb5e95)), closes [#195](https://github.com/ozzy-labs/create-agentic-dev/issues/195)
* rename package to @ozzylabs/create-agentic-app ([#207](https://github.com/ozzy-labs/create-agentic-dev/issues/207)) ([3131e6e](https://github.com/ozzy-labs/create-agentic-dev/commit/3131e6e19c42183826f6f0c854dd137741301b0e))
* **renovate:** migrate to shared org preset ([#168](https://github.com/ozzy-labs/create-agentic-dev/issues/168)) ([38d93e2](https://github.com/ozzy-labs/create-agentic-dev/commit/38d93e2547197de1a1be729969e7ab12c53a673d))
* show forced dependency hints in CLI wizard ([#114](https://github.com/ozzy-labs/create-agentic-dev/issues/114)) ([b15e832](https://github.com/ozzy-labs/create-agentic-dev/commit/b15e8327b6f437e4d408289b06cf9a1f364b88e6))
* split base preset and add Agent layer with claude-code preset ([#97](https://github.com/ozzy-labs/create-agentic-dev/issues/97)) ([3f18df8](https://github.com/ozzy-labs/create-agentic-dev/commit/3f18df80baaa7fe97a1392ec268b4162b6f21d9b))
* support output path in CLI argument ([#23](https://github.com/ozzy-labs/create-agentic-dev/issues/23)) ([bd91a57](https://github.com/ozzy-labs/create-agentic-dev/commit/bd91a5705e7abf1a7662331ad80b274759a1fe79))


### Bug Fixes

* add explicit node types to tsconfig for CI compatibility ([#144](https://github.com/ozzy-labs/create-agentic-dev/issues/144)) ([e4d521d](https://github.com/ozzy-labs/create-agentic-dev/commit/e4d521d6a9c2d7e3df1c855a6c45d0bf7fb948af))
* add Playwright E2E test step to shared skill and fix MCP package name ([#204](https://github.com/ozzy-labs/create-agentic-dev/issues/204)) ([1492c56](https://github.com/ozzy-labs/create-agentic-dev/commit/1492c56d9c9700e5c5e06e35af412c5ada8e8287))
* add safety guards and improve error handling ([#103](https://github.com/ozzy-labs/create-agentic-dev/issues/103)) ([c545fcc](https://github.com/ozzy-labs/create-agentic-dev/commit/c545fcc6f97596567a9406393816c6b92bb17295))
* address review findings across all 6 backend framework issues ([#84](https://github.com/ozzy-labs/create-agentic-dev/issues/84)) ([0b0a49b](https://github.com/ozzy-labs/create-agentic-dev/commit/0b0a49b4cfeab95280bd1301791a40a6d435973c))
* align lint:md script with CI by excluding CHANGELOG.md ([#163](https://github.com/ozzy-labs/create-agentic-dev/issues/163)) ([044a93f](https://github.com/ozzy-labs/create-agentic-dev/commit/044a93f374a79aeeb1ec7c86ee375ec28dc86530))
* combine release-please and publish into single workflow ([#149](https://github.com/ozzy-labs/create-agentic-dev/issues/149)) ([6a50502](https://github.com/ozzy-labs/create-agentic-dev/commit/6a50502d7483aec2332e0b6bfc9ff3bdea92e5f2))
* deduplicate markdown section injections across presets ([#19](https://github.com/ozzy-labs/create-agentic-dev/issues/19)) ([c264c8e](https://github.com/ozzy-labs/create-agentic-dev/commit/c264c8e5b559cee2deedce54384b4eb094acdd9a))
* ensure blank line before headings in merged markdown sections ([#153](https://github.com/ozzy-labs/create-agentic-dev/issues/153)) ([438d928](https://github.com/ozzy-labs/create-agentic-dev/commit/438d92878c878c8121808780e941b048613ab471))
* filter empty strings and fix inline separator in expandMarkdown ([#21](https://github.com/ozzy-labs/create-agentic-dev/issues/21)) ([c3a605e](https://github.com/ozzy-labs/create-agentic-dev/commit/c3a605e16f637b270769bece9d76d03e3a83b48a)), closes [#20](https://github.com/ozzy-labs/create-agentic-dev/issues/20)
* improve generated project quality ([#52](https://github.com/ozzy-labs/create-agentic-dev/issues/52)) ([d1d3677](https://github.com/ozzy-labs/create-agentic-dev/commit/d1d3677347edf819d6347a469e31f51d3fa2e0b6)), closes [#51](https://github.com/ozzy-labs/create-agentic-dev/issues/51)
* improve generated project quality (bicep lint, lefthook glob, biome ignore) ([#64](https://github.com/ozzy-labs/create-agentic-dev/issues/64)) ([c01e932](https://github.com/ozzy-labs/create-agentic-dev/commit/c01e93217110421d16c9857ddc09af3393aac863)), closes [#63](https://github.com/ozzy-labs/create-agentic-dev/issues/63)
* improve generated project quality (cfn-lint conflict, cdk-nag usage) ([#62](https://github.com/ozzy-labs/create-agentic-dev/issues/62)) ([d27bbb2](https://github.com/ozzy-labs/create-agentic-dev/commit/d27bbb2a9f2b4512001fcd07ee00d73eae68533d)), closes [#61](https://github.com/ozzy-labs/create-agentic-dev/issues/61)
* improve generated project quality (gitignore, devcontainer, CDK, tflint, Renovate) ([#60](https://github.com/ozzy-labs/create-agentic-dev/issues/60)) ([4076707](https://github.com/ozzy-labs/create-agentic-dev/commit/40767076d4b2d7d03a990f33a38d596ebfb083d6))
* improve generated project quality (MCP comma, per-IaC CD, remove dclint) ([#56](https://github.com/ozzy-labs/create-agentic-dev/issues/56)) ([d4d8f58](https://github.com/ozzy-labs/create-agentic-dev/commit/d4d8f584f2e3899ea426e30a799a9c9125140687))
* improve generated project quality (MCP example, cfn-lint, CD docs, mypy scope) ([#58](https://github.com/ozzy-labs/create-agentic-dev/issues/58)) ([e7e5430](https://github.com/ozzy-labs/create-agentic-dev/commit/e7e5430a9e1a6ce485c941735537a5e97e439dfb))
* improve generated project quality (Ruff select, Renovate biome schema) ([#71](https://github.com/ozzy-labs/create-agentic-dev/issues/71)) ([7868b22](https://github.com/ozzy-labs/create-agentic-dev/commit/7868b22645bb4c2ee799bfbb0d686e8a7848173f))
* improve generated project quality and add cloud-aware Terraform CD ([#137](https://github.com/ozzy-labs/create-agentic-dev/issues/137)) ([a7f55a3](https://github.com/ozzy-labs/create-agentic-dev/commit/a7f55a3a1196d5444f74145f1cd87f0319cdd795))
* improve generated project quality for multi-IaC presets ([#54](https://github.com/ozzy-labs/create-agentic-dev/issues/54)) ([a3a8277](https://github.com/ozzy-labs/create-agentic-dev/commit/a3a82774c8b5336a975608a983b4a89b67c4fe7a)), closes [#53](https://github.com/ozzy-labs/create-agentic-dev/issues/53)
* **preset:** add dev server port forwarding and Playwright webServer config ([#189](https://github.com/ozzy-labs/create-agentic-dev/issues/189)) ([269872e](https://github.com/ozzy-labs/create-agentic-dev/commit/269872e5f53b8582d0b663d743dda0ff0dfe3d20))
* **preset:** resolve Playwright baseURL by frontend and add CDK typecheck to CI ([#190](https://github.com/ozzy-labs/create-agentic-dev/issues/190)) ([65bc590](https://github.com/ozzy-labs/create-agentic-dev/commit/65bc59081cc5c3a55e161992f5e715fb73a92ef7))
* **preset:** use unique Trivy IaC CI step names to avoid dedup conflict ([#172](https://github.com/ozzy-labs/create-agentic-dev/issues/172)) ([a85feb4](https://github.com/ozzy-labs/create-agentic-dev/commit/a85feb48427e93cfe5b363b32c6b26102e2d1a8a))
* replace note box with log.step for next steps display ([#40](https://github.com/ozzy-labs/create-agentic-dev/issues/40)) ([bac39e2](https://github.com/ozzy-labs/create-agentic-dev/commit/bac39e282146eb586763b03adad73b13f6e1f306))
* resolve generated project issues found in manual verification ([#17](https://github.com/ozzy-labs/create-agentic-dev/issues/17)) ([5dd3b9e](https://github.com/ozzy-labs/create-agentic-dev/commit/5dd3b9ed270d032f0bfdade594770248ca8e22c1)), closes [#16](https://github.com/ozzy-labs/create-agentic-dev/issues/16)
* resolve generated project issues found in manual verification ([#35](https://github.com/ozzy-labs/create-agentic-dev/issues/35)) ([b17632e](https://github.com/ozzy-labs/create-agentic-dev/commit/b17632e961f5b733a5b17005136b16db5de543d2))
* resolve generated project issues found in manual verification (round 2) ([#37](https://github.com/ozzy-labs/create-agentic-dev/issues/37)) ([85e24b8](https://github.com/ozzy-labs/create-agentic-dev/commit/85e24b894880cda2c2ef846c22b5e3cea697cf64))
* resolve template inconsistencies in yamllint, test skill, and git-workflow ([#22](https://github.com/ozzy-labs/create-agentic-dev/issues/22)) ([d0ff2bd](https://github.com/ozzy-labs/create-agentic-dev/commit/d0ff2bdc4cf7293b7a4352d3bc1bfe19862fe5dd))
* run lint:python (ruff) before lint:mypy in lint:all script ([#191](https://github.com/ozzy-labs/create-agentic-dev/issues/191)) ([c7da616](https://github.com/ozzy-labs/create-agentic-dev/commit/c7da616b1ba492eae8a49281c74b71abc3a92531))
* unify IaC option labels to use hint for cloud provider names ([#50](https://github.com/ozzy-labs/create-agentic-dev/issues/50)) ([8430dd5](https://github.com/ozzy-labs/create-agentic-dev/commit/8430dd518e8b977786d1902b7d550b4da037bd6e))
* update all GitHub Actions to latest commit hashes ([#142](https://github.com/ozzy-labs/create-agentic-dev/issues/142)) ([f369032](https://github.com/ozzy-labs/create-agentic-dev/commit/f36903220e92ea2ff0412517bfb17303bbd42afc))
* update release-please-action to valid v4 commit hash ([#141](https://github.com/ozzy-labs/create-agentic-dev/issues/141)) ([2dfd7c6](https://github.com/ozzy-labs/create-agentic-dev/commit/2dfd7c69ecd627d4a83ddfc13464fd6416311ea0))

## [0.1.2](https://github.com/ozzy-labs/create-agentic-dev/compare/create-agentic-dev-v0.1.1...create-agentic-dev-v0.1.2) (2026-04-11)


### Features

* add --apply mode for agent setup on existing projects ([#184](https://github.com/ozzy-labs/create-agentic-dev/issues/184)) ([3355bf4](https://github.com/ozzy-labs/create-agentic-dev/commit/3355bf40d18d88e7772d4f849e483feb4fee23c5)), closes [#176](https://github.com/ozzy-labs/create-agentic-dev/issues/176)
* **preset:** add Hono backend preset ([#182](https://github.com/ozzy-labs/create-agentic-dev/issues/182)) ([295c875](https://github.com/ozzy-labs/create-agentic-dev/commit/295c87520b8382a636163308ba5a26484870708f)), closes [#181](https://github.com/ozzy-labs/create-agentic-dev/issues/181)
* **preset:** add Playwright E2E testing preset with Testing layer ([#185](https://github.com/ozzy-labs/create-agentic-dev/issues/185)) ([2346ec7](https://github.com/ozzy-labs/create-agentic-dev/commit/2346ec786d0c1d151b0e372914202ddd6ade7c8e)), closes [#175](https://github.com/ozzy-labs/create-agentic-dev/issues/175)
* **preset:** add SvelteKit and Astro frontend presets ([#183](https://github.com/ozzy-labs/create-agentic-dev/issues/183)) ([089231a](https://github.com/ozzy-labs/create-agentic-dev/commit/089231ab349d27465d93e92921cbeb66810c7eb1)), closes [#180](https://github.com/ozzy-labs/create-agentic-dev/issues/180)
* **preset:** add Trivy security scanning ([#171](https://github.com/ozzy-labs/create-agentic-dev/issues/171)) ([74dd1cf](https://github.com/ozzy-labs/create-agentic-dev/commit/74dd1cf0188448d1fb70d17e16b5c3f492c3e820)), closes [#166](https://github.com/ozzy-labs/create-agentic-dev/issues/166)
* **renovate:** migrate to shared org preset ([#168](https://github.com/ozzy-labs/create-agentic-dev/issues/168)) ([38d93e2](https://github.com/ozzy-labs/create-agentic-dev/commit/38d93e2547197de1a1be729969e7ab12c53a673d))


### Bug Fixes

* **preset:** add dev server port forwarding and Playwright webServer config ([#189](https://github.com/ozzy-labs/create-agentic-dev/issues/189)) ([269872e](https://github.com/ozzy-labs/create-agentic-dev/commit/269872e5f53b8582d0b663d743dda0ff0dfe3d20))
* **preset:** resolve Playwright baseURL by frontend and add CDK typecheck to CI ([#190](https://github.com/ozzy-labs/create-agentic-dev/issues/190)) ([65bc590](https://github.com/ozzy-labs/create-agentic-dev/commit/65bc59081cc5c3a55e161992f5e715fb73a92ef7))
* **preset:** use unique Trivy IaC CI step names to avoid dedup conflict ([#172](https://github.com/ozzy-labs/create-agentic-dev/issues/172)) ([a85feb4](https://github.com/ozzy-labs/create-agentic-dev/commit/a85feb48427e93cfe5b363b32c6b26102e2d1a8a))
* run lint:python (ruff) before lint:mypy in lint:all script ([#191](https://github.com/ozzy-labs/create-agentic-dev/issues/191)) ([c7da616](https://github.com/ozzy-labs/create-agentic-dev/commit/c7da616b1ba492eae8a49281c74b71abc3a92531))

## [0.1.1](https://github.com/ozzy-labs/create-agentic-dev/compare/create-agentic-dev-v0.1.0...create-agentic-dev-v0.1.1) (2026-04-11)


### Bug Fixes

* align lint:md script with CI by excluding CHANGELOG.md ([#163](https://github.com/ozzy-labs/create-agentic-dev/issues/163)) ([044a93f](https://github.com/ozzy-labs/create-agentic-dev/commit/044a93f374a79aeeb1ec7c86ee375ec28dc86530))

## Changelog
