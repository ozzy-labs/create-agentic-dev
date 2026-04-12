---
description: 開発環境のフルセットアップを行う
disable-model-invocation: true
allowed-tools: Bash, AskUserQuestion
---

# setup

`.agents/skills/setup/SKILL.md` を Read し、ワークフローに従う。

## Claude 固有ルール

- 各ステップの状態を報告し、**同じレスポンス内で** AskUserQuestion を呼び出す（`answers` パラメータは設定しない）。報告の出力だけでスキルを終了しない

## 次のアクション提案（スキル完了後）

- **「実装を開始する」** → `.claude/skills/implement/SKILL.md` を Read し、その手順に従う
- **「lint を実行する」** → `.claude/skills/lint/SKILL.md` を Read し、その手順に従う
