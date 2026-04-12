---
description: 変更をステージし、Conventional Commits でコミットする（push はしない）
disable-model-invocation: true
allowed-tools: Bash, Read, Grep, Glob, AskUserQuestion
---

# commit

`.agents/skills/commit/SKILL.md` を Read し、ワークフローに従う。

## Claude 固有ルール

- commit-conventions は `.claude/skills/commit-conventions/SKILL.md` を Read する（Claude overlay 版を使用）
- 完了報告の直後に AskUserQuestion を呼び出す（`answers` パラメータは設定しない）。報告の出力だけでスキルを終了しない

## 次のアクション提案（スキル完了後）

以下は基本選択肢であり、状況に応じて追加の選択肢を提示してよい:

- **「テストを実行する」** → `.claude/skills/test/SKILL.md` を Read し、その手順に従う
- **「PR を作成する」** → `.claude/skills/pr/SKILL.md` を Read し、その手順に従う
- **「lint・テスト・コミット・PR まで一括実行する」** → `.claude/skills/ship/SKILL.md` を Read し、その手順に従う
- **「追加の変更を行う」** → 終了する
