# 搬移到獨立 repo 的步驟

這個 `standalone/` 目錄是「AI 學習中心」的**獨立專案版**:網站在根目錄、
路徑全部調整完畢,可直接變成新 repo 的 main 分支。

## 前置:在 GitHub 建立空 repo

https://github.com/new → 名稱 `ai-learning-hub` → **Public** → 不勾任何初始化選項。

## 在你本機執行

```bash
git clone --depth 1 --branch claude/ai-news-learning-site-u0821s https://github.com/benson5566/claude-code.git tmp-src
cd tmp-src/standalone
git init -b main
git add -A
git commit -m "初始化 AI 學習中心"
git remote add origin https://github.com/benson5566/ai-learning-hub.git
git push -u origin main
cd ../.. && rm -rf tmp-src   # 清理暫存
```

## 最後一步:啟用 GitHub Pages

新 repo 的 **Settings → Pages → Source 選「GitHub Actions」**(一次性)。
之後每次 push 到 main 會自動部署到:

> https://benson5566.github.io/ai-learning-hub/

## 搬移完成後

- 舊 fork(claude-code)裡的 `ai-learning-hub/`、`standalone/` 與相關
  `.claude/commands/`、workflow 都可以刪除,避免兩份內容混淆
- 之後的內容更新、Claude Code 指令(/generate-posts、/convert-post、
  /analyze-video)都在新 repo 內執行
