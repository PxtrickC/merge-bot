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

        console.log('\\n🔔 New Merge Event Detected!');
        console.log(`   Token Burned: #${tokenIdBurned}`);
        console.log(`   Token Persist: #${tokenIdPersist}`);
        console.log(`   Combined Mass: ${combinedMass}`);
        console.log(`   TX Hash: ${transactionHash}`);

        // 查詢當前總供應量
        const totalSupply = await contract.totalSupply();
        console.log(`   Total Supply: ${totalSupply}`);

        // 查詢合併前兩個 Token 的 value
        let burnedClass = 1, burnedMass = 0, persistClass = 1, persistMassBeforeMerge = 0;

        try {
            // 獲取事件發生的區塊號
            const eventBlockNumber = event.blockNumber;

            // 查詢合併前（該交易發生前）兩個 token 的 value
            // 使用 blockTag 來獲取該區塊之前的狀態
            const blockBeforeMerge = eventBlockNumber - 1;

            console.log(`   Fetching pre-merge token values at block ${blockBeforeMerge}...`);

            // 查詢被燒毀的 token 在合併前的 value
            const burnedTokenValue = await contract.getValueOf(tokenIdBurned, { blockTag: blockBeforeMerge });
            burnedClass = decodeClass(burnedTokenValue);
            burnedMass = decodeMass(burnedTokenValue);

            // 查詢存活的 token 在合併前的 value
            const persistTokenValueBefore = await contract.getValueOf(tokenIdPersist, { blockTag: blockBeforeMerge });
            persistClass = decodeClass(persistTokenValueBefore);
            persistMassBeforeMerge = decodeMass(persistTokenValueBefore);

            console.log(`   Burned Token (#${tokenIdBurned}): Tier ${burnedClass}, Mass ${burnedMass}`);
            console.log(`   Persist Token (#${tokenIdPersist}): Tier ${persistClass}, Mass before ${persistMassBeforeMerge} → after ${Number(combinedMass)}`);
        } catch (error) {
            console.warn('   Warning: Could not fetch historical token values, using estimate');
            console.warn('   Error:', error.message);
            // 使用估算值作為fallback
            burnedClass = 1;
            persistClass = 1;
            burnedMass = Math.floor(Number(combinedMass) / 2);
            persistMassBeforeMerge = Number(combinedMass) - burnedMass;
        }

        // 獲取合併後 NFT 的圖片
        const imageUrl = await getTokenImageURL(contract, tokenIdPersist);

        // 處理圖片：如果是 SVG data URI，轉換為 PNG Buffer
        let imageBuffer = null;
        let finalImageUrl = imageUrl;

        if (imageUrl && imageUrl.startsWith('data:image/svg+xml')) {
            try {
                // 修正：動態導入 sharp，避免在沒有安裝時報錯
                const sharp = (await import('sharp')).default;

                console.log('   🔄 Converting SVG to PNG...');

                // 處理 base64 編碼的 SVG
                let svgBuffer;
                if (imageUrl.includes('base64,')) {
                    const base64Data = imageUrl.split('base64,')[1];
                    svgBuffer = Buffer.from(base64Data, 'base64');
                } else {
                    // 處理 URL 編碼的 SVG
                    const svgString = decodeURIComponent(imageUrl.split(',')[1]);
                    svgBuffer = Buffer.from(svgString);
                }

                // 轉換為 PNG
                imageBuffer = await sharp(svgBuffer)
                    .png()
                    .toBuffer();

                console.log('   ✅ SVG converted to PNG buffer');
                // 使用 attachment URL schema
                finalImageUrl = 'attachment://merge.png';

            } catch (error) {
                console.error('   ❌ Error converting SVG to PNG:', error.message);
                // 轉換失敗則回退到不顯示圖片
                finalImageUrl = null;
            }
        }

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
            imageUrl: finalImageUrl,
            imageBuffer: imageBuffer // 傳遞 Buffer 給 Discord client
        };

        // 發送 Discord 通知
        await sendMergeNotification(eventData);

    } catch (error) {
        console.error('❌ Error handling merge event:', error);
    }
}
