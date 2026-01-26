import dotenv from 'dotenv';
import { initializeDiscordClient, closeDiscordClient } from './discord/client.js';
import { initializeEthereumListener, closeEthereumListener } from './ethereum/listener.js';

// 載入環境變數
dotenv.config();

// 驗證必要的環境變數
const requiredEnvVars = ['DISCORD_TOKEN', 'DISCORD_CHANNEL_ID', 'ETHEREUM_RPC_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    console.error('📝 Please copy .env.example to .env and fill in the values');
    process.exit(1);
}

async function startBot() {
    console.log('🚀 Starting Merge NFT Discord Bot...\n');

    try {
        // 初始化 Discord 客戶端
        await initializeDiscordClient(
            process.env.DISCORD_TOKEN,
            process.env.DISCORD_CHANNEL_ID
        );

        // 初始化以太坊監聽器
        await initializeEthereumListener(process.env.ETHEREUM_RPC_URL);

        console.log('\n✨ Bot is now running! Press Ctrl+C to stop.\n');

    } catch (error) {
        console.error('❌ Failed to start bot:', error);
        await cleanup();
        process.exit(1);
    }
}

async function cleanup() {
    console.log('\n🛑 Shutting down bot...');
    await closeEthereumListener();
    closeDiscordClient();
    console.log('👋 Goodbye!\n');
}

// 處理程序終止信號
process.on('SIGINT', async () => {
    await cleanup();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await cleanup();
    process.exit(0);
});

// 啟動機器人
startBot();
