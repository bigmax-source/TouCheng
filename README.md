# 頭城地方記憶典藏 v1.71

這是可直接部署至 GitHub Pages 的完整靜態網站。v1.71 延續 v1.7「地方地圖版」，並加入正式權利聲明、逐筆典藏編號、資料完整性雜湊與「慶元宮前的二二八記憶」策展。

## 專案身分

- 創站日期：2026-08-02（依本專案最早 Git 提交紀錄）
- 地方編纂與人工校訂：頭城二三事
- 資料整理、程式開發與文字協作：頭城二三事與 ChatGPT
- 本版：v1.71
- 資料更新：2026-08-04
- 時間軸：500 筆，依年代拆成 23 個 JSON 檔，每次分批顯示 50 筆

## v1.71 重點

- `copyright.html`：正式「著作權與使用規範」。
- `robots.txt`：向已知 AI 訓練爬蟲表達禁止抓取的政策；robots 規則屬自願遵守，真正的伺服器端限制規劃於 Cloudflare。
- 全站頁尾統一權利聲明與使用規範連結。
- 每筆事件顯示唯一典藏編號 `TC-H-原事件ID`；既有事件永久連結不變。
- `audit.html` 公開顯示資料版本、紀錄數與標準化資料集 SHA-256。
- 新增頭城二二八策展，並將 1947 年受難、2016 年紀念碑事件與慶元宮地點互相連結。
- `DEPLOYMENT-PLAN.md`：自訂網域與 Cloudflare 分階段規劃。
- `RELEASE-v1.7.md` 與 `SHA256SUMS-v1.7.txt`：保存尚未上傳之 v1.7 原始發布證據。

## 使用限制

© 2026 頭城二三事／頭城地方記憶典藏。本站原創文字、事件摘要、資料選擇、分類架構、編排方式、策展內容、介面設計及程式碼，除另有標示外，保留所有權利。未經書面同意，不得以自動化工具大量擷取、重製、鏡像、重新發布，或用於建立其他資料庫、商業服務及人工智慧模型訓練。

合理引用請註明完整來源、事件網址與存取日期。個別史料、政府資料、出版內容及影像之權利仍屬原權利人所有；日期、名稱與單純事實不因收錄而成為本站獨占內容。完整條文見 [`copyright.html`](copyright.html)。

## 部署 v1.71

1. 解壓縮 `TouCheng-v1.71.zip`。
2. 將資料夾內所有檔案上傳至 GitHub Pages 儲存庫根目錄，取代舊版同名檔案。
3. 確認 `index.html`、`robots.txt`、`copyright.html` 與 `assets/` 位於同一層。
4. 等候 GitHub Pages 完成發布後，重新整理首頁、時間軸、地方地圖、人物與觀點、資料與校訂頁。

注意：在 `bigmax-source.github.io/TouCheng/` 這類專案子路徑下，儲存庫內的 `robots.txt` 不一定能成為整個主機的根層規則。改用自訂網域後，應把它部署於 `https://自訂網域/robots.txt`，並以 Cloudflare AI Crawl Control／WAF 作第二層限制。

## 資料建置與驗證

```bash
python3 tools/build-history.py
node tools/build-places.mjs
```

建置流程會檢查事件來源 ID 不重複，產生年代分檔、校訂報告、地點關聯索引及：

- `assets/data/data-integrity.json`
- `assets/data/data-integrity.js`

本版標準化資料集 SHA-256：

```text
36351db854f89203297241a9594cbb82672b9d286503a416ddfd3cd688522a78
```

## v1.7 Release 說明

使用者尚未把 v1.7 上傳至 GitHub，因此不能把 `v1.7` 標籤錯掛到 v1.61 或 v1.71 的提交。原始 `TouCheng-v1.7.zip` 應先以其真實內容建立對應提交，再建立 `v1.7` Release 並附上該壓縮檔。

原始 v1.7 壓縮檔 SHA-256：

```text
818bd10f2fac4d39326693d0d751e1598f86b5f8b7cc97400fd9967d25fa30b6
```

Release 文字與核對檔見 `RELEASE-v1.7.md`、`SHA256SUMS-v1.7.txt`。
