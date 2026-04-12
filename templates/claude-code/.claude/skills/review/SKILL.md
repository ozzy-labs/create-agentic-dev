---
description: コード変更や PR をレビューし、問題点・改善案を報告する
argument-hint: "<#PR-number | (blank for working tree changes)>"
disable-model-invocation: true
allowed-tools: Bash, Read, Grep, Glob, AskUserQuestion
---

# review

`.agents/skills/review/SKILL.md` を Read し、ワークフローに従う。

## Claude 固有ルール

- レビュー完了後、AskUserQuestion を呼び出す（`answers` パラメータは設定しない）。報告の出力だけでスキルを終了しない

## 次のアクション提案（スキル完了後）

以下は基本選択肢であり、状況に応じて追加の選択肢を提示してよい:

**PR レビューの場合:**

- **「指摘事項を修正する」**（指摘ありの場合） → 指摘事項に基づきコードを修正する。修正完了後、再度 AskUserQuestion で次のアクションを確認する:
  - **「再レビューする」** → Step 1 に戻る
  - **「コミット・push する」** → `.claude/skills/commit/SKILL.md` を Read し、その手順に従う。完了後、`.claude/skills/pr/SKILL.md` を Read し、その手順に従う
  - **「追加の変更を行う」** → 終了する
- **「このまま進める」** → 終了する

**ローカル変更レビューの場合:**

- **「指摘事項を修正する」**（指摘ありの場合） → 指摘事項に基づきコードを修正する。修正完了後、再度 AskUserQuestion で次のアクションを確認する:
  - **「再レビューする」** → Step 1 に戻る
  - **「lint・テスト・コミット・PR まで一括実行する」** → `.claude/skills/ship/SKILL.md` を Read し、その手順に従う
  - **「追加の変更を行う」** → 終了する
- **「lint・テスト・コミット・PR まで一括実行する」** → `.claude/skills/ship/SKILL.md` を Read し、その手順に従う
- **「このまま進める」** → 終了する
