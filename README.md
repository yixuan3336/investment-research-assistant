# 投資研究助手（GitHub Pages 版）

以聊天方式分析股票趨勢、近期新聞與風險。靜態聊天介面部署到 GitHub Pages；行情擷取與 OpenAI API 呼叫放在 Cloudflare Worker，避免把 API 金鑰放進公開網頁。

## 專案內容

- `outputs/site/`：GitHub Pages 靜態網站。
- `worker/`：Cloudflare Worker API，抓取行情並呼叫 OpenAI Responses API 與 web search。
- `.github/workflows/pages.yml`：推送 `main` 後用 GitHub Actions 發布 Pages。
- `.github/workflows/worker.yml`：推送 Worker 變更後部署 Cloudflare Worker；首次部署需先設定 secrets，再從 Actions 手動執行。
- `knowledge/plan.md`：產品願景與路線圖。

## 發布 Pages

1. 在 repository Settings → Pages 將 Build and deployment 的 Source 設為 **GitHub Actions**。
2. 推送至 `main` 後，Pages workflow 會自動發布網站。
3. 預期網址：`https://yixuan3336.github.io/investment-research-assistant/`。

## 啟用 AI 分析 API

API 需要 Cloudflare 帳戶，以及 OpenAI API 金鑰。API 使用可能產生費用；ChatGPT 訂閱不包含 API 額度。

1. 建立 Cloudflare API token，授予部署 Workers 的權限，並取得 Cloudflare Account ID。
2. 在 repository Settings → Secrets and variables → Actions 設定：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `OPENAI_API_KEY`
3. `worker/wrangler.toml` 已設定允許來源 `https://yixuan3336.github.io`。推送程式後，到 Actions 手動執行 **Deploy analysis API to Cloudflare Workers**，完成首次 Worker 部署並寫入 OpenAI API 金鑰。
4. 從 Worker 部署結果取得 `workers.dev` 網址，到網站右上角「設定」貼上網址並儲存。

Cloudflare API token 與 OpenAI API key 都只放在 repository secrets / Worker secret，切勿寫入程式碼或前端設定。建議在 OpenAI 帳戶設定用量告警和上限，並定期檢查費用。

## 使用

輸入「分析台積電最近走勢」或「NVDA 最近有哪些風險？」。台股可輸入常見公司名稱或代號，美股可輸入股票代碼；可在偏好設定選擇投資期間與風險承受度。

## 資料與限制

- 價格資料透過 Yahoo Finance chart endpoint 取得，可能延遲或缺漏。
- AI 使用 OpenAI Responses API 的 web search 搜尋近期資訊；回覆應提供來源連結，搜尋會增加 API 使用成本。
- Worker 有簡單的每 IP 頻率限制，但仍應監控 API 使用量。
- 僅供研究輔助，不構成投資建議；不保證績效、不連接券商、不會下單。
