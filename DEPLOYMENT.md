# 部署到 GitHub Pages

本網站使用 Docusaurus，透過 GitHub Actions 自動建置並部署到 GitHub Pages。流程已備妥（見 `.github/workflows/deploy.yml`），完成以下步驟即可上線。

## 1. 建立你自己的 GitHub repo

目前 `origin` 指向原作者的 repo（你沒有推送權限）。建立你自己的 repo，並把 `origin` 換成它：

```bash
git remote remove origin
git remote add origin https://github.com/<你的帳號>/<你的repo名>.git
```

## 2. 填入你的帳號與 repo 名

編輯 `docusaurus.config.ts`，把 `OWNER` 與 repo 名換成你的（共影響 `url`、`baseUrl`、`organizationName`、`projectName`，以及 navbar/footer 的 GitHub 連結）。規則：

- **專案網站**（repo 名是 `ai-system-design-guide` 之類）：
  - `url: 'https://<你的帳號>.github.io'`
  - `baseUrl: '/<你的repo名>/'`（**結尾要有斜線**）
- **使用者/組織網站**（repo 名剛好是 `<你的帳號>.github.io`）：
  - `url: 'https://<你的帳號>.github.io'`
  - `baseUrl: '/'`

> 若把帳號/repo 名告訴我，我可以直接幫你改好這些設定。

## 3. 啟用 GitHub Pages 的 Actions 來源

在 GitHub repo 的 **Settings → Pages → Build and deployment → Source**，選擇 **GitHub Actions**。

## 4. 推送即部署

```bash
git add -A
git commit -m "feat: bilingual Docusaurus site"
git push -u origin main
```

推送後，Actions 會自動建置（英文 + 繁體中文）並部署。完成後網址為：

- 英文：`https://<你的帳號>.github.io/<你的repo名>/`
- 繁中：`https://<你的帳號>.github.io/<你的repo名>/zh-Hant/`

## 本地預覽（部署前驗證）

```bash
npm install      # 第一次
npm run build    # 建置 en + zh-Hant
npm run serve    # 本地預覽 http://localhost:3000
```
