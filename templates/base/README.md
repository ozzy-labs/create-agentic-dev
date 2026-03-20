# {{projectName}}

AI エージェント連携を前提とした開発プロジェクト。

## 前提条件

- WSL2 / Ubuntu 24.04（または互換環境）
- Git
- [mise](https://mise.jdx.dev/)（未インストールの場合、setup.sh が自動インストール）

## クイックスタート

```bash
cd {{projectName}}
bash scripts/setup.sh
```

`scripts/setup.sh` は以下を実行します:

1. mise 未インストール時の自動インストール
1. `mise trust` + `mise install`（全開発ツール）
<!-- SECTION:SETUP_STEPS -->

## ディレクトリ構成

```text
{{projectName}}/
├── .claude/             # Claude Code 設定・スキル
├── .devcontainer/       # Dev Container 設定
├── .github/             # GitHub Actions, PR テンプレート, CODEOWNERS
├── .vscode/             # VSCode 設定・推奨拡張
├── docs/                # ドキュメント
├── scripts/             # シェルスクリプト
<!-- SECTION:DIR_STRUCTURE -->
├── .mise.toml           # 全ツールバージョン定義
├── lefthook.yaml        # Git フック定義
<!-- SECTION:ROOT_FILES -->
└── renovate.json        # Renovate 設定
```

## コマンド一覧

### セットアップ

| コマンド | 説明 |
|---------|------|
| `bash scripts/setup.sh` | フルセットアップ |
| `mise install` | 全ツールインストール |
<!-- SECTION:SETUP_COMMANDS -->

### リント・フォーマット

| コマンド | 説明 |
|---------|------|
| `pnpm run lint:md` | Markdown リント |
| `pnpm run lint:yaml` | YAML リント |
| `pnpm run lint:shell` | Shell リント（shellcheck + shfmt） |
| `pnpm run lint:toml` | TOML フォーマットチェック（taplo） |
| `pnpm run lint:docker` | Dockerfile リント（hadolint） |
| `pnpm run lint:compose` | Docker Compose リント（dclint） |
| `pnpm run lint:actions` | GitHub Actions リント（actionlint） |
| `pnpm run lint:secrets` | シークレット検出（Gitleaks） |
<!-- SECTION:LINT_COMMANDS -->

### テスト

| コマンド | 説明 |
|---------|------|
<!-- SECTION:TEST_COMMANDS -->

## Conventional Commits

[Conventional Commits 1.0.0](https://www.conventionalcommits.org/) に準拠（commitlint で強制）。

```text
<type>[optional scope]: <description>
```

| type | 用途 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメント |
| `style` | フォーマット（動作変更なし） |
| `refactor` | リファクタリング |
| `perf` | パフォーマンス改善 |
| `test` | テスト |
| `build` | ビルド・依存関係 |
| `ci` | CI 設定 |
| `chore` | その他 |

## AI エージェント連携

### Claude Code

- **`CLAUDE.md`** - プロジェクトガイダンス
- **`.claude/settings.json`** - プロジェクトレベルの権限設定
- **`.claude/skills/`** - スキル（/setup, /implement, /lint, /test, /commit, /pr, /review, /ship）
- **`.mcp.json`** - MCP サーバー設定

## ライセンス

MIT
