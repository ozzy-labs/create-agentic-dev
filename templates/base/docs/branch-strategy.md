# ブランチ戦略

このドキュメントはブランチ戦略の SSOT（Single Source of Truth）です。

## 採用戦略: GitHub Flow

シンプルな `main` + feature branches モデルを採用。

- `main` は常にデプロイ可能な状態を維持
- 全変更は feature branch から PR を経由して `main` にマージ
- マージ方法は **squash merge のみ**（1 PR = 1 コミット）

## ブランチ命名規則

```text
<type>/<short-description>
```

### type 一覧

| type | 用途 | 例 |
|------|------|----|
| `feat` | 新機能 | `feat/add-auth` |
| `fix` | バグ修正 | `fix/login-error` |
| `docs` | ドキュメント | `docs/update-readme` |
| `style` | フォーマット（動作変更なし） | `style/fix-indent` |
| `refactor` | リファクタリング | `refactor/extract-utils` |
| `perf` | パフォーマンス改善 | `perf/optimize-query` |
| `test` | テスト | `test/add-auth-tests` |
| `build` | ビルド・依存関係 | `build/upgrade-node` |
| `ci` | CI 設定 | `ci/add-lint-job` |
| `chore` | その他 | `chore/update-gitignore` |

### 命名ルール

- 英小文字 + ハイフン区切り（`kebab-case`）
- 簡潔で内容が伝わる名前にする
- Issue 番号を含める場合: `feat/123-add-auth`

## ワークフロー

```text
1. main から feature branch を作成
2. 変更を実装・コミット（Conventional Commits）
3. GitHub に push
4. PR を作成
5. CI チェック通過を確認
6. squash merge で main にマージ
7. feature branch を削除
```

## main ブランチ保護ルール

- main への直接 push 禁止
- force push 禁止
- PR 経由のマージのみ許可
- CI チェック通過必須

## Issue 作成ポリシー

- Issue 作成は **任意**
- `feat`（新機能）と `fix`（バグ修正）は Issue 作成を **推奨**
- `docs`, `chore`, `style` 等の軽微な変更は Issue 不要

## コミット規約

[Conventional Commits 1.0.0](https://www.conventionalcommits.org/) に準拠。commitlint で強制。

```text
<type>[optional scope]: <description>
```

## Lefthook フック構成

| フック | 実行内容 |
|--------|----------|
| `commit-msg` | commitlint（コミットメッセージ検証） |
| `pre-commit` | Biome, Ruff, shellcheck, shfmt, taplo, markdownlint, yamlfmt, yamllint, dockerfmt, hadolint, actionlint, gitleaks（自動修正 + セキュリティ） |
| `pre-push` | TypeScript typecheck, mypy |

設定ファイル: [`lefthook.yaml`](../lefthook.yaml)
