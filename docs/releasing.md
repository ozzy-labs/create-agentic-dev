# Releasing

## Overview

リリースは [Release Please](https://github.com/googleapis/release-please) + GitHub Actions で自動化されている。

`release.yaml` が Release Please と npm publish を統合した単一ワークフローとして動作する。

| ジョブ | 役割 |
|-------|------|
| `release-please` | main への push で version bump PR を自動作成（CHANGELOG 生成含む） |
| `publish` | release-please がリリースを作成した場合のみ build → npm publish を実行（lint/test は CI で検証済み） |

npm への公開は [Trusted Publishing (OIDC)](https://docs.npmjs.com/trusted-publishers/) を使用する。NPM_TOKEN は不要。

## 通常のリリースフロー

1. feature branch を main にマージする
2. Release Please が version bump PR を自動作成する
3. PR をマージすると GitHub Release + git tag が自動作成される
4. `release.yaml` が npm publish を自動実行する（OIDC 認証）

## 初回リリース手順

npm の Trusted Publishing はパッケージが npm に存在している必要があるため、初回のみ手動で publish する。

### 1. Release Please PR をマージする

main への push 後に Release Please が作成する PR をマージする。これにより:

- `package.json` の version が更新される
- `CHANGELOG.md` が生成される
- GitHub Release + git tag（例: `v0.1.0`）が作成される
- `release.yaml` の `publish` ジョブが実行されるが、Trusted Publishing 未設定のため npm publish は失敗する（想定通り）

### 2. ローカルから手動 publish

```bash
git pull
git checkout v0.1.0     # Release Please が作成したタグ
pnpm build
npm login               # npmjs.com にブラウザ認証
npm publish --access public
```

### 3. npmjs.com で Trusted Publishing を設定

1. <https://www.npmjs.com/package/@ozzylabs/create-agentic-dev/access> にアクセス
2. **Trusted Publisher** セクションで **GitHub Actions** を選択
3. 以下を入力（大文字小文字を区別）:
   - **Repository owner**: `ozzy-labs`
   - **Repository name**: `create-agentic-dev`
   - **Workflow filename**: `release.yaml`
4. 保存する

### 4. 動作確認（任意）

設定後に `release.yaml` を手動で再実行して、OIDC 認証で publish が成功することを確認する:

```bash
gh run rerun <run-id>
```

以降のリリースは全自動で行われる。

## バージョニング

[Conventional Commits](https://www.conventionalcommits.org/) に基づいて Release Please が自動判定する。

| コミットタイプ | 0.x の間 | 1.x 以降 |
|-------------|---------|---------|
| `feat` | patch bump | minor bump |
| `fix` | patch bump | patch bump |
| `feat!` (breaking) | minor bump | major bump |

設定: `release-please-config.json`（`bump-minor-pre-major: true`）
