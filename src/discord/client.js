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

        const embed = new EmbedBuilder()
            .setColor(0x00AE86) // Merge 主題色
            .setTitle('🔄 Merge NFT 合併事件')
            .setDescription('檢測到新的 NFT 合併！')
            .addFields(
                {
                    name: '💀 被銷毀的 Token',
                    value: `[#${eventData.tokenIdBurned}](https://etherscan.io/nft/${eventData.contractAddress}/${eventData.tokenIdBurned})`,
                    inline: true
                },
                {
                    name: '✨ 存活的 Token',
                    value: `[#${eventData.tokenIdPersist}](https://etherscan.io/nft/${eventData.contractAddress}/${eventData.tokenIdPersist})`,
                    inline: true
                },
                {
                    name: '⚖️ 合併後質量',
                    value: eventData.mass.toLocaleString(),
                    inline: true
                },
                {
                    name: '📊 當前總供應量',
                    value: `${eventData.totalSupply.toLocaleString()} NFTs`,
                    inline: false
                },
                {
                    name: '🔗 交易連結',
                    value: `[在 Etherscan 上查看](https://etherscan.io/tx/${eventData.transactionHash})`,
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ text: 'Merge NFT Monitor' });

        await channel.send({ embeds: [embed] });
        console.log(`✅ Notification sent for merge: Token #${eventData.tokenIdBurned} → #${eventData.tokenIdPersist}`);

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
