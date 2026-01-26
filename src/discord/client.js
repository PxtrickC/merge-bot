import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';

let discordClient = null;
let targetChannelId = null;

/**
 * 初始化 Discord 客戶端
 * @param {string} token - Discord bot token
 * @param {string} channelId - Target channel ID for notifications
 */
export async function initializeDiscordClient(token, channelId) {
    targetChannelId = channelId;

    discordClient = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
        ],
    });

    discordClient.once('ready', () => {
        console.log(`✅ Discord bot logged in as ${discordClient.user.tag}`);
        console.log(`📢 Monitoring channel ID: ${targetChannelId}`);
    });

    discordClient.on('error', (error) => {
        console.error('❌ Discord client error:', error);
    });

    await discordClient.login(token);

    return discordClient;
}

/**
 * 將 tier 轉換為顏色圓點 emoji
 * @param {number} tier - NFT tier (1-4)
 * @returns {string} Colored emoji
 */
function getTierEmoji(tier) {
    switch (tier) {
        case 1: return '⚪️'; // 白色
        case 2: return '🟡'; // 黃色
        case 3: return '🔵'; // 藍色
        case 4: return '🔴'; // 紅色
        default: return '⚪️';
    }
}

/**
 * 發送 Merge 事件通知到 Discord
 * @param {Object} eventData - Merge event data
 */
export async function sendMergeNotification(eventData) {
    if (!discordClient || !targetChannelId) {
        console.error('❌ Discord client not initialized');
        return;
    }

    try {
        const channel = await discordClient.channels.fetch(targetChannelId);

        if (!channel) {
            console.error('❌ Channel not found');
            return;
        }

        // 生成緊湊格式的合併表示
        const burnedEmoji = getTierEmoji(eventData.burnedTier);
        const persistEmoji = getTierEmoji(eventData.persistTier);

        const burnedMassFormatted = eventData.burnedMass.toLocaleString();
        const persistMassBeforeFormatted = eventData.persistMassBeforeMerge.toLocaleString();
        const combinedMassFormatted = eventData.combinedMass.toLocaleString();

        // 第一行：合併表示
        const mergeLine = `${burnedEmoji} (${burnedMassFormatted}) [#${eventData.tokenIdBurned}](https://etherscan.io/nft/${eventData.contractAddress}/${eventData.tokenIdBurned}) → ${persistEmoji} (${persistMassBeforeFormatted}) [#${eventData.tokenIdPersist}](https://etherscan.io/nft/${eventData.contractAddress}/${eventData.tokenIdPersist}) = ${persistEmoji} (${combinedMassFormatted}) [#${eventData.tokenIdPersist}](https://etherscan.io/nft/${eventData.contractAddress}/${eventData.tokenIdPersist})`;

        // 第二行：剩餘數量
        const remainLine = `${eventData.totalSupply.toLocaleString()}/28990 remain`;

        // 第三行：交易連結
        const linkLine = `link: [Etherscan](https://etherscan.io/tx/${eventData.transactionHash})`;

        // 組合完整描述
        const description = `${mergeLine}\n${remainLine}\n${linkLine}`;

        const embed = new EmbedBuilder()
            .setColor(0x00AE86) // Merge 主題色
            .setTitle('🔄 Merge NFT 合併事件')
            .setDescription(description)
            .setTimestamp()
            .setFooter({ text: 'Tier: ⚪️=1 | 🟡=2 | 🔵=3 | 🔴=4' });

        // 如果有圖片 URL，添加到 embed
        if (eventData.imageUrl) {
            embed.setImage(eventData.imageUrl);
        }

        const messageOptions = { embeds: [embed] };

        // 如果有圖片 Buffer，作為附件發送
        if (eventData.imageBuffer) {
            messageOptions.files = [{
                attachment: eventData.imageBuffer,
                name: 'merge.png'
            }];
        }

        await channel.send(messageOptions);
        console.log(`✅ Notification sent: ${burnedEmoji} #${eventData.tokenIdBurned} → ${persistEmoji} #${eventData.tokenIdPersist}`);

    } catch (error) {
        console.error('❌ Error sending Discord notification:', error);
    }
}

/**
 * 關閉 Discord 客戶端
 */
export function closeDiscordClient() {
    if (discordClient) {
        discordClient.destroy();
        console.log('👋 Discord client disconnected');
    }
}
