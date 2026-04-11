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

## 手動リリース

Trusted Publishing が使えない場合や、緊急で手動リリースが必要な場合の手順。

### 前提条件

- npm アカウントで 2FA（セキュリティキー / パスキー）が有効であること
- npm は TOTP（認証アプリ）の新規登録を廃止済み。WebAuthn（Touch ID / Windows Hello / YubiKey 等）のみ対応
- クラシックトークンは 2025 年 12 月に廃止済み

### 手順

```bash
npm login               # ブラウザ認証
npm publish --access public --provenance false
```

- `--provenance false`: provenance 生成は GitHub Actions OIDC 専用。ローカルでは無効化が必要
- publish 時にブラウザが開き、WebAuthn 認証を求められる

### 代替: Granular Access Token

2FA を設定できない環境では、Granular Access Token で publish できる:

1. npmjs.com → Access Tokens → Generate New Token → Granular Access Token
2. **Bypass two-factor authentication** にチェック
3. Packages: Read and write、Orgs: `@ozzylabs`
4. publish:

```bash
npm publish --access public --provenance false --//registry.npmjs.org/:_authToken=<token>
```

## Trusted Publishing の設定

npmjs.com でパッケージの Trusted Publishing を設定する手順（初回のみ）:

1. <https://www.npmjs.com/package/@ozzylabs/create-agentic-dev/access> にアクセス
2. **Trusted Publisher** セクションで **GitHub Actions** を選択
3. 以下を入力:
   - **Repository owner**: `ozzy-labs`
   - **Repository name**: `create-agentic-dev`
   - **Workflow filename**: `release.yaml`
   - **Environment name**: （空欄）
4. 保存する

## バージョニング

[Conventional Commits](https://www.conventionalcommits.org/) に基づいて Release Please が自動判定する。

| コミットタイプ | 0.x の間 | 1.x 以降 |
|-------------|---------|---------|
| `feat` | patch bump | minor bump |
| `fix` | patch bump | patch bump |
| `feat!` (breaking) | minor bump | major bump |

設定: `release-please-config.json`（`bump-minor-pre-major: true`）
