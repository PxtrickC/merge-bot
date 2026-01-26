# Render 部署指南 🚀

本指南將幫助您將 Merge NFT Discord Bot 部署到 Render。

## 📋 前置準備

在開始之前，請確保您已經：
- ✅ 有 GitHub 帳號
- ✅ 有 Render 帳號（[免費註冊](https://render.com)）
- ✅ 準備好 Discord Bot Token
- ✅ 準備好 Discord Channel ID
- ✅ 準備好 Ethereum RPC URL（Infura 或 Alchemy）

---

## 🔧 步驟 1: 推送程式碼到 GitHub

### 1.1 初始化 Git Repository（如果還沒有）

```bash
cd /Users/pinhsuchiang/Library/CloudStorage/GoogleDrive-patrick@amplegroupglobal.com/我的雲端硬碟/Antigravity/merge-bot
git init
git add .
git commit -m "Initial commit: Merge NFT Discord Bot"
```

### 1.2 創建 GitHub Repository

1. 前往 [GitHub](https://github.com/new)
2. 創建新的 repository（例如：`merge-nft-discord-bot`）
3. **不要** 勾選 "Initialize this repository with a README"

### 1.3 推送到 GitHub

```bash
git remote add origin https://github.com/你的用戶名/merge-nft-discord-bot.git
git branch -M main
git push -u origin main
```

---

## 🌐 步驟 2: 在 Render 創建服務

### 2.1 連接 GitHub

1. 登入 [Render Dashboard](https://dashboard.render.com)
2. 點擊 **"New +"** → **"Web Service"**
3. 選擇 **"Build and deploy from a Git repository"**
4. 點擊 **"Connect GitHub"**（如果還沒連接）
5. 授權 Render 訪問您的 GitHub repositories

### 2.2 選擇 Repository

1. 找到並選擇您剛剛創建的 repository
2. 點擊 **"Connect"**

### 2.3 配置服務

Render 應該會自動檢測到 `render.yaml` 文件，但您也可以手動配置：

| 設定項目 | 值 |
|---------|-----|
| **Name** | `merge-nft-bot`（或您想要的名稱） |
| **Region** | `Oregon (US West)` 或離您最近的區域 |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

---

## 🔐 步驟 3: 設置環境變數

在 Render 服務設置頁面，找到 **"Environment"** 部分：

### 3.1 添加環境變數

點擊 **"Add Environment Variable"** 並添加以下變數：

#### 必要變數：

1. **DISCORD_TOKEN**
   - Value: `你的_Discord_Bot_Token`
   - 🔒 建議勾選 "Secret"（隱藏顯示）

2. **DISCORD_CHANNEL_ID**
   - Value: `你的_Discord_頻道_ID`

3. **ETHEREUM_RPC_URL**
   - Value: `wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID`
   - 或: `wss://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
   - 🔒 建議勾選 "Secret"

#### 自動設置的變數：

4. **MERGE_CONTRACT_ADDRESS**
   - Value: `0xc3f8a0f5841abff777d3eefa5047e8d413a1c9ab`
   - （這個已在 `render.yaml` 中設定）

5. **NODE_VERSION**
   - Value: `18`
   - （這個已在 `render.yaml` 中設定）

### 3.2 保存設置

點擊 **"Save Changes"** 或 **"Create Web Service"**

---

## 🚀 步驟 4: 部署

### 4.1 自動部署

一旦您保存了設置，Render 會自動開始部署：

1. 📦 拉取 GitHub 代碼
2. 🔧 執行 `npm install`
3. ▶️ 執行 `npm start`
4. ✅ 服務上線

### 4.2 查看日誌

在 Render Dashboard 中，點擊您的服務查看實時日誌：

成功啟動後，您應該看到類似的日誌：

```
🚀 Starting Merge NFT Discord Bot...

✅ Discord bot logged in as YourBot#1234
📢 Monitoring channel ID: 123456789012345678
🔌 Connecting to Ethereum network...
✅ Connected to network: mainnet (chainId: 1)
📜 Merge contract loaded: 0xc3f8a0f5841abff777d3eefa5047e8d413a1c9ab
📊 Current NFT supply: XXXX
👂 Listening for MassUpdate events...

✨ Bot is now running! Press Ctrl+C to stop.
```

---

## ✅ 步驟 5: 驗證部署

### 5.1 檢查 Discord Bot 狀態

在您的 Discord 伺服器中，檢查 Bot 是否顯示為**在線**（綠色圓點）

### 5.2 等待合併事件

Bot 現在會自動監聽 Merge NFT 合併事件並發送通知到您指定的頻道！

---

## 🔄 後續更新

當您修改代碼後：

```bash
git add .
git commit -m "更新描述"
git push
```

Render 會自動檢測到 GitHub 更新並重新部署！

---

## 🐛 疑難排解

### Bot 無法啟動

**查看日誌找到錯誤訊息：**

1. **"Missing required environment variables"**
   - 確認所有環境變數都已正確設置
   - 檢查變數名稱是否正確（區分大小寫）

2. **Discord 連接錯誤**
   - 確認 `DISCORD_TOKEN` 正確
   - 確認 Bot 已被邀請到伺服器
   - 檢查 Bot 權限設定

3. **Ethereum 連接錯誤**
   - 確認 RPC URL 正確且有效
   - 檢查 RPC 提供商的配額限制
   - 確保使用 WebSocket URL（`wss://`）

### Render 免費方案限制

**免費方案特點：**
- ✅ 750 小時/月（足夠 24/7 運行）
- ✅ 不會因為無活動而休眠（因為 Bot 持續監聽事件）
- ⚠️ 有記憶體和 CPU 限制（但對此 Bot 足夠）

如果遇到限制，可以考慮升級到付費方案（$7/月起）

---

## 📊 監控與維護

### 查看實時日誌

在 Render Dashboard → 您的服務 → "Logs" 標籤

### 手動重啟服務

在 Render Dashboard → 您的服務 → "Manual Deploy" → "Clear build cache & deploy"

### 查看資源使用

在 Render Dashboard → 您的服務 → "Metrics" 標籤

---

## 💡 最佳實踐

1. **使用環境變數**：永遠不要在代碼中硬編碼敏感資訊
2. **定期檢查日誌**：確保 Bot 正常運行
3. **監控 RPC 使用量**：避免超出免費配額
4. **備份配置**：記錄所有環境變數的值（安全保存）

---

## 🆘 需要幫助？

- [Render 官方文檔](https://render.com/docs)
- [Discord.js 指南](https://discordjs.guide/)
- [Ethers.js 文檔](https://docs.ethers.org/)

---

🎉 恭喜！您的 Merge NFT Discord Bot 現在已經在 Render 上 24/7 運行了！
