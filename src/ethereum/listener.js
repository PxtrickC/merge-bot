import { ethers } from 'ethers';
import { createMergeContract } from './contract.js';
import { handleMergeEvent } from '../handlers/mergeHandler.js';

let provider = null;
let contract = null;

/**
 * 初始化以太坊監聽器
 * @param {string} rpcUrl - Ethereum RPC URL (WebSocket recommended)
 */
export async function initializeEthereumListener(rpcUrl) {
    try {
        console.log('🔌 Connecting to Ethereum network...');

        // 創建 Provider（支持 WebSocket 和 HTTP）
        if (rpcUrl.startsWith('wss://') || rpcUrl.startsWith('ws://')) {
            provider = new ethers.WebSocketProvider(rpcUrl);
        } else {
            provider = new ethers.JsonRpcProvider(rpcUrl);
        }

        // 測試連接
        const network = await provider.getNetwork();
        console.log(`✅ Connected to network: ${network.name} (chainId: ${network.chainId})`);

        // 創建合約實例
        contract = createMergeContract(provider);
        console.log(`📜 Merge contract loaded: ${await contract.getAddress()}`);

        // 獲取當前狀態
        const totalSupply = await contract.totalSupply();
        console.log(`📊 Current NFT supply: ${totalSupply}`);

        // 監聽 MassUpdate 事件
        console.log('👂 Listening for MassUpdate events...\n');

        contract.on('MassUpdate', async (tokenIdBurned, tokenIdPersist, mass, event) => {
            await handleMergeEvent(event, contract);
        });

        // 處理提供者錯誤
        provider.on('error', (error) => {
            console.error('❌ Provider error:', error);
        });

        // WebSocket 重連處理
        if (provider instanceof ethers.WebSocketProvider) {
            provider._websocket.on('close', () => {
                console.warn('⚠️  WebSocket connection closed. Attempting to reconnect...');
                setTimeout(() => initializeEthereumListener(rpcUrl), 5000);
            });
        }

        return { provider, contract };

    } catch (error) {
        console.error('❌ Failed to initialize Ethereum listener:', error);
        throw error;
    }
}

/**
 * 關閉以太坊監聽器
 */
export async function closeEthereumListener() {
    if (contract) {
        contract.removeAllListeners();
        console.log('👋 Stopped listening to contract events');
    }

    if (provider) {
        await provider.destroy();
        console.log('👋 Ethereum provider disconnected');
    }
}
