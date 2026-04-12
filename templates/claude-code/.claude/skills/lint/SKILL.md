---
description: 全リンターを自動修正付きで実行し、結果を報告する
disable-model-invocation: true
allowed-tools: Bash, Read, AskUserQuestion
---

# lint

`.agents/skills/lint/SKILL.md` を Read し、ワークフローに従う。

## Claude 固有ルール

- lint-rules は `.claude/skills/lint-rules/SKILL.md` を Read する（Claude overlay 版を使用）
- サマリー報告の直後に AskUserQuestion を呼び出す（`answers` パラメータは設定しない）。報告の出力だけでスキルを終了しない

## 次のアクション提案（スキル完了後）

以下は基本選択肢であり、状況に応じて追加の選択肢を提示してよい:

**全て通過した場合:**

- **「テストを実行する」** → `.claude/skills/test/SKILL.md` を Read し、その手順に従う
- **「コミットする」** → `.claude/skills/commit/SKILL.md` を Read し、その手順に従う
- **「テスト・コミット・PR まで一括実行する」** → `.claude/skills/ship/SKILL.md` を Read し、その手順に従う
- **「追加の変更を行う」** → 終了する

**エラーがある場合:**

- **「エラーを修正する」** → 修正完了後、手順 1 に戻って再実行する
- **「追加の変更を行う」** → 終了する
