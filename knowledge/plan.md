# 投資研究助手：願景與路線圖

## 願景

打造以聊天為主的股票研究助手。使用者用自然語言提出股票或市場問題，助手主動整理近期價格、技術趨勢與時事，說明判斷依據、可能情境、風險和可考慮的下一步。使用者提供問題與選填的投資情況，自己決定是否採取行動。

產品用於協助研究與理解，不保證漲跌或績效，不將 AI 輸出當成確定的買賣指令。初版不連券商、不登入交易帳戶、不下單。

## 產品流程

1. 使用者以股票名稱、代號或一般問題開始對話。
2. 助手辨識標的；不確定時先追問。
3. API 抓取近期日線價格、技術指標並搜尋相關時事。
4. AI 用繁體中文整理趨勢依據、新聞線索、偏多／中性／偏空情境、可考慮的下一步與風險，標示來源和資料日期。
5. 使用者可選擇補充持倉、成本、投資期間和風險承受度，再自行核對並決定。

## 設計原則

- 聊天優先；不要求使用者先理解圖表或指標。
- 區分資料、推論及情境，說明不確定性。
- 投資偏好及持倉資訊採選填。
- OpenAI API 金鑰只存於服務端 secret，不放進公開前端。
- 使用者自行掌握交易決定；初版不連券商或執行交易。

## 目前狀態

**MVP 已建立並開始上傳到 GitHub；Pages 與分析 API 尚未完成發布。**

Repository：[yixuan3336/investment-research-assistant](https://github.com/yixuan3336/investment-research-assistant)（公開）。靜態聊天網站在 outputs/site/，行情與 AI API 在 worker/；Actions workflows 位於 .github/workflows/。網站、Worker 程式與兩個 workflows 已提交；Pages workflow 執行與 Pages 設定待確認。

網站用 GitHub Pages 發布；Worker 需部署在 Cloudflare，避免公開 OpenAI 金鑰。行情透過 Yahoo Finance chart endpoint，近期時事透過 OpenAI Responses API web search。AI 使用量可能收費。

## 路線圖

### 已完成

- [x] 確認聊天式產品方向，由助手查資料和解釋，使用者自行決策。
- [x] 建立早期 Streamlit 聊天原型。
- [x] 建立 Pages 靜態聊天介面及 Worker API 程式。
- [x] 建立 GitHub Pages 與 Cloudflare Worker Actions workflows。
- [x] 建立公開 GitHub repository，提交 README、.gitignore、網站、Worker 和部署流程。
- [x] 在 Worker 端保管 OpenAI 金鑰，加入來源檢查及基本頻率限制。

### 待完成

- [ ] 在 repository Settings → Pages 將 Source 設為 GitHub Actions。
- [ ] 確認 GitHub Actions 成功發布 Pages 網站。
- [ ] 設定 Cloudflare 帳戶、部署 token、Account ID 及 OpenAI API key 等 repository secrets。
- [ ] 手動啟動 Worker workflow 完成首次 API 部署，並將 Worker 網址設定到網站。
- [ ] 驗證端到端聊天、行情、新聞引用及錯誤訊息。
- [ ] 加強股票名稱辨識、上市／上櫃代號與多輪追問處理。
- [ ] 評估行情與新聞來源的穩定性、授權、延遲和成本。
- [ ] 評估更可靠的 API 頻率限制及成本控制。
- [ ] 視需求加入持倉分析、隱私設定與資料保存選項。

## 已知限制

- 行情來源可能延遲、缺漏或限流；新聞搜尋結果不保證完整。
- AI 摘要與解讀可能出錯，應核對引用來源。
- Worker 目前的記憶體頻率限制不具持久性，仍需監控 API 費用。
- 工具僅供研究參考，不構成投資建議，也不保證績效。
