---
description: Issue または指示をもとに、ブランチ作成・実装を行う
argument-hint: "<#issue-number | instruction>"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch, WebFetch, AskUserQuestion
---

# implement

`.agents/skills/implement/SKILL.md` を Read し、ワークフローに従う。

## Claude 固有ルール

- Step 1: 引数なしの場合は AskUserQuestion で「何を実装しますか？（Issue 番号 or 説明）」と確認する
- Step 3: 実装計画を提示後、AskUserQuestion で確認する:「この計画で実装」「計画を修正」「キャンセル」。承認なしにコード変更を開始しない
- Step 5: 実装完了を報告し、**同じレスポンス内で** AskUserQuestion を呼び出す（`answers` パラメータは設定しない）。報告の出力だけでスキルを終了しない

## 次のアクション提案（スキル完了後）

- **「lint・テスト・コミット・PR まで一括実行する」** → `.claude/skills/ship/SKILL.md` を Read し、その手順に従う
- **「個別に lint を実行する」** → `.claude/skills/lint/SKILL.md` を Read し、その手順に従う
- **「追加の変更を行う」** → 終了する
