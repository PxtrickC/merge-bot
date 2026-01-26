import { sendMergeNotification } from '../discord/client.js';
import { MERGE_CONTRACT_ADDRESS } from '../ethereum/contract.js';
import { getTokenImageURL } from '../ethereum/metadata.js';

/**
 * 從 value 中解碼 class (tier)
 * @param {BigInt} value - Token value
 * @returns {number} Class/Tier (1-4)
 */
function decodeClass(value) {
    const CLASS_MULTIPLIER = 100000000n; // 100 million
    return Number(value / CLASS_MULTIPLIER);
}

/**
 * 從 value 中解碼 mass
 * @param {BigInt} value - Token value
 * @returns {number} Mass
 */
function decodeMass(value) {
    const CLASS_MULTIPLIER = 100000000n; // 100 million
    return Number(value % CLASS_MULTIPLIER);
}

/**
 * 處理 MassUpdate 事件
 * @param {Object} event - Event object from ethers
 * @param {ethers.Contract} contract - Merge contract instance
 */
export async function handleMergeEvent(event, contract) {
    try {
        const tokenIdBurned = event.args.tokenIdBurned;
        const tokenIdPersist = event.args.tokenIdPersist;
        const combinedMass = event.args.mass;
        const transactionHash = event.transactionHash;

        console.log('\n🔔 New Merge Event Detected!');
        console.log(`   Token Burned: #${tokenIdBurned}`);
        console.log(`   Token Persist: #${tokenIdPersist}`);
        console.log(`   Combined Mass: ${combinedMass}`);
        console.log(`   TX Hash: ${transactionHash}`);

        // 查詢當前總供應量
        const totalSupply = await contract.totalSupply();
        console.log(`   Total Supply: ${totalSupply}`);

        // 查詢存活 Token 的 value 來獲取 class 和 mass
        let burnedClass = 1, burnedMass = 0, persistClass = 1, persistMassBeforeMerge = 0;

        try {
            // 查詢存活 token 合併後的狀態
            const persistTokenValue = await contract.getValueOf(tokenIdPersist);
            persistClass = decodeClass(persistTokenValue);
            const persistMassAfterMerge = decodeMass(persistTokenValue);

            // 從合併後的總質量計算原始質量
            // combinedMass = persistMassBeforeMerge + burnedMass
            // persistMassAfterMerge = combinedMass
            persistMassBeforeMerge = Number(combinedMass) - (persistMassAfterMerge - Number(combinedMass));

            // 簡化：假設兩個 token 同一 tier（通常情況）
            burnedClass = persistClass;
            burnedMass = Number(combinedMass) - persistMassBeforeMerge;

            console.log(`   Burned Token: Tier ${burnedClass}, Mass ~${burnedMass}`);
            console.log(`   Persist Token: Tier ${persistClass}, Mass before ${persistMassBeforeMerge} → after ${persistMassAfterMerge}`);
        } catch (error) {
            console.warn('   Warning: Using estimated values for token details');
            // 使用估算值
            burnedClass = 1;
            persistClass = 1;
            burnedMass = Math.floor(Number(combinedMass) / 2);
            persistMassBeforeMerge = Number(combinedMass) - burnedMass;
        }

        // 獲取合併後 NFT 的圖片
        const imageUrl = await getTokenImageURL(contract, tokenIdPersist);

        // 準備通知資料
        const eventData = {
            tokenIdBurned: tokenIdBurned.toString(),
            tokenIdPersist: tokenIdPersist.toString(),
            burnedTier: burnedClass,
            burnedMass: burnedMass,
            persistTier: persistClass,
            persistMassBeforeMerge: persistMassBeforeMerge,
            combinedMass: Number(combinedMass),
            totalSupply: Number(totalSupply),
            transactionHash: transactionHash,
            contractAddress: MERGE_CONTRACT_ADDRESS,
            timestamp: new Date().toISOString(),
            imageUrl: imageUrl // 添加圖片 URL
        };

        // 發送 Discord 通知
        await sendMergeNotification(eventData);

    } catch (error) {
        console.error('❌ Error handling merge event:', error);
    }
}
