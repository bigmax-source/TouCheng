# 自訂網域與 Cloudflare 導入規劃

## 目標

保留 GitHub Pages 作為公開版本及發行證據，以自訂網域連接 Cloudflare，進一步管理 HTTPS、快取、爬蟲策略與存取紀錄。

## 建議順序

1. 確認正式網域名稱及登記人，網域所有權應由頭城二三事掌握。
2. 先保留 `bigmax-source.github.io/TouCheng/` 正常運作。
3. 在 GitHub Pages 設定自訂網域，由 GitHub 產生或驗證 `CNAME`。
4. 將網域 DNS 交由 Cloudflare 管理，先使用 DNS only 完成驗證，再評估是否開啟代理。
5. 開啟 Always Use HTTPS、TLS 1.2 以上及合理快取；HTML 保持較短快取，版本化靜態資源可使用長快取。
6. 啟用 AI Crawl Control 的觀察功能，先看實際流量，再建立已驗證 AI 爬蟲的阻擋規則。
7. 保留 `robots.txt`，但不把它視為安全邊界；對不遵守協定的大量擷取應使用 Cloudflare WAF／Bot 規則。
8. 每次正式版本建立 Git tag、GitHub Release、ZIP SHA-256 與資料集 SHA-256。

## 導入前不做的事

- 未確認網域所有權前，不建立正式 DNS。
- 未完成 GitHub Pages 自訂網域驗證前，不強制代理流量。
- 不關閉一般搜尋引擎，以免頭城地方史資料難以被民眾找到。

## 驗收清單

- 自訂網域可以 HTTPS 連線。
- GitHub Pages 原網址與自訂網域沒有無限轉址。
- `robots.txt` 位於自訂網域根目錄。
- 地圖圖磚、歷史資料分檔及永久連結正常。
- Cloudflare 紀錄可區分一般訪客、搜尋引擎與 AI 爬蟲。
