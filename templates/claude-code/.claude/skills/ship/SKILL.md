---
description: lint・テスト・コミット・PR 作成を一括実行する
disable-model-invocation: true
allowed-tools: Bash, Read, Grep, Glob, AskUserQuestion
---

# ship

`.agents/skills/ship/SKILL.md` を Read し、ワークフローに従う。

## Claude 固有ルール

- 各子スキルは `.claude/skills/` パスから Read する（lint, test, commit）。読み込んだ子スキル内の「次のアクション提案」セクションは**すべて無視**する
- PR ステップはインライン実行する（PR スキルには委譲しない）
- 完了報告の直後に AskUserQuestion を呼び出す（`answers` パラメータは設定しない）。報告の出力だけでスキルを終了しない

## 次のアクション提案（スキル完了後）

- **「PR をレビューする」** → `.claude/skills/review/SKILL.md` を Read し、その手順に従う
- **「PR をマージする」** → `gh pr merge --squash --delete-branch` でマージを実行し、結果を報告する
