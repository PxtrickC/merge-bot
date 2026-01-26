# Merge NFT Discord Bot 🤖

Discord 機器人用於監聽 [Merge NFT](https://etherscan.io/token/0xc3f8a0f5841abff777d3eefa5047e8d413a1c9ab) 合約的合併事件，並自動發送通知到 Discord 頻道。

## ✨ 功能特色

- 🔄 即時監聽 Merge NFT 合併事件
- 📢 自動發送精美的 Discord Embed 通知
- 📊 顯示當前 NFT 總供應量
- 🔗 包含 Etherscan 交易連結
- 🔌 WebSocket 連接支持（即時性更好）
- 🔁 自動重連機制

## 📋 前置需求

1. **Node.js** (v18 或更高版本)
2. **Discord Bot Token**
3. **Ethereum RPC URL**（建議使用 Infura 或 Alchemy）

## 🚀 快速開始

### 1️⃣ 安裝依賴

```bash
npm install
```

### 2️⃣ 配置環境變數

複製 `.env.example` 為 `.env`：

```bash
cp .env.example .env
```

編輯 `.env` 文件，填入以下資訊：

```env
DISCORD_TOKEN=你的_Discord_Bot_Token
DISCORD_CHANNEL_ID=你的_頻道_ID
ETHEREUM_RPC_URL=你的_RPC_URL
```

### 3️⃣ 啟動機器人

```bash
npm start
```

或使用開發模式（支持熱重載）：

```bash
npm run dev
```

## 🤖 創建 Discord Bot

### 步驟 1: 創建應用程式

1. 前往 [Discord Developer Portal](https://discord.com/developers/applications)
2. 點擊 "New Application"
3. 輸入應用程式名稱（例如：Merge NFT Monitor）
4. 點擊 "Create"

### 步驟 2: 創建 Bot

1. 在左側選單點擊 "Bot"
2. 點擊 "Add Bot"
3. 點擊 "Reset Token" 複製 Token（這就是 `DISCORD_TOKEN`）
4. ⚠️ **重要**：保管好您的 Token，不要分享給任何人

### 步驟 3: 設置權限

在 "Bot" 頁面中：
- 取消勾選 "Public Bot"（可選）
- 啟用以下 Privileged Gateway Intents（如需要）：
  - ✅ MESSAGE CONTENT INTENT（如果需要讀取訊息）

### 步驟 4: 邀請 Bot 到伺服器

1. 在左側選單點擊 "OAuth2" → "URL Generator"
2. 勾選 Scopes:
   - ✅ `bot`
3. 勾選 Bot Permissions:
   - ✅ `Send Messages`
   - ✅ `Embed Links`
4. 複製生成的 URL 並在瀏覽器中打開
5. 選擇要加入的伺服器並授權

### 步驟 5: 獲取 Channel ID

1. 在 Discord 中啟用開發者模式：
   - 設定 → 進階 → 開發者模式（開啟）
2. 右鍵點擊要接收通知的頻道
3. 點擊 "複製頻道 ID"（這就是 `DISCORD_CHANNEL_ID`）

## 🔌 設置 Ethereum RPC

### 使用 Infura

1. 前往 [Infura](https://infura.io/)
2. 創建帳號並登入
3. 創建新專案
4. 複製 **WebSocket** URL：
   ```
   wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID
   ```

### 使用 Alchemy

1. 前往 [Alchemy](https://www.alchemy.com/)
2. 創建帳號並登入
3. 創建新 App（選擇 Ethereum Mainnet）
4. 複製 **WebSocket** URL：
   ```
   wss://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
   ```

## 📦 項目結構

```
merge-bot/
├── src/
│   ├── index.js                  # 主程式入口
│   ├── discord/
│   │   └── client.js            # Discord 客戶端
│   ├── ethereum/
│   │   ├── listener.js          # 事件監聽器
│   │   ├── contract.js          # 合約實例
│   │   └── abi/
│   │       └── Merge.json       # 合約 ABI
│   └── handlers/
│       └── mergeHandler.js      # 事件處理器
├── .env                         # 環境變數（需自行創建）
├── .env.example                 # 環境變數範本
├── package.json                 # 專案配置
└── README.md                    # 說明文件
```

## 📸 通知範例

機器人會發送包含以下資訊的 Embed 訊息：

- 💀 被銷毀的 Token ID（含 Etherscan 連結）
- ✨ 存活的 Token ID（含 Etherscan 連結）
- ⚖️ 合併後的總質量
- 📊 當前 NFT 總供應量
- 🔗 交易的 Etherscan 連結

## 🔧 疑難排解

### Bot 無法連接到 Discord

- 確認 `DISCORD_TOKEN` 正確
- 確認 Bot 已被邀請到伺服器
- 檢查網路連接

### 無法監聽區塊鏈事件

- 確認 `ETHEREUM_RPC_URL` 正確
- 建議使用 WebSocket URL（`wss://`）而非 HTTP
- 檢查 RPC 提供商的配額限制

### Channel ID 錯誤

- 確認已啟用 Discord 開發者模式
- 確認 Bot 有權限訪問該頻道
- 檢查 Channel ID 是否正確複製

## 🌐 部署到 Render

本專案已配置好 Render 部署支援！

### 快速部署步驟：

1. 推送代碼到 GitHub
2. 在 [Render](https://render.com) 創建新的 Web Service
3. 連接您的 GitHub repository
4. 設置環境變數（DISCORD_TOKEN, DISCORD_CHANNEL_ID, ETHEREUM_RPC_URL）
5. 點擊部署！

📖 **詳細部署指南**: 請查看 [DEPLOY.md](file:///Users/pinhsuchiang/Library/CloudStorage/GoogleDrive-patrick@amplegroupglobal.com/我的雲端硬碟/Antigravity/merge-bot/DEPLOY.md)

### 為什麼選擇 Render？

- ✅ 免費方案（750 小時/月）
- ✅ 自動從 GitHub 部署
- ✅ 不會休眠（持續運行的服務）
- ✅ 簡單的環境變數管理
- ✅ 自動 HTTPS 和域名



## 📝 開發說明

本專案使用 ES6 Modules (`type: "module"`)，因此：
- 使用 `import/export` 而非 `require()`
- 檔案需使用 `.js` 副檔名

## 📄 授權

MIT License

## 🙏 致謝

- [Merge NFT](https://merge.pak.gg/) by Pak
- [discord.js](https://discord.js.org/)
- [ethers.js](https://docs.ethers.org/)

---

如有問題或建議，歡迎開 Issue！
