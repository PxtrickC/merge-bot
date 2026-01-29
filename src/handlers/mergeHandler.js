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

        // ethers.js v6: ContractEventPayload 結構中，log 資訊在 event.log 中
        const transactionHash = event.log?.transactionHash || event.transactionHash;
        const eventBlockNumber = event.log?.blockNumber || event.blockNumber;

        console.log('\\n🔔 New Merge Event Detected!');
        console.log(`   Token Burned: #${tokenIdBurned}`);
        console.log(`   Token Persist: #${tokenIdPersist}`);
        console.log(`   Combined Mass: ${combinedMass}`);
        console.log(`   TX Hash: ${transactionHash}`);
        console.log(`   Block Number: ${eventBlockNumber}`);

        // 查詢當前總供應量
        const totalSupply = await contract.totalSupply();
        console.log(`   Total Supply: ${totalSupply}`);

        // 查詢合併前兩個 Token 的 value
        let burnedClass = 1, burnedMass = 0, persistClass = 1, persistMassBeforeMerge = 0;

        try {
            // 確保 blockNumber 是有效數字
            if (!eventBlockNumber || isNaN(eventBlockNumber)) {
                throw new Error(`Invalid block number: ${eventBlockNumber}`);
            }

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
            console.warn('   Warning: Could not fetch historical token values at block -1');
            console.warn('   Error:', error.message);

            // 改進的 fallback：嘗試從當前狀態反推
            try {
                console.log('   Attempting fallback: fetching current persist token value...');

                // 查詢 persist token 在合併後的當前值（就是 combinedMass）
                // 這個值在事件中已經有了，但我們需要 tier
                const persistTokenValueAfter = await contract.getValueOf(tokenIdPersist);
                persistClass = decodeClass(persistTokenValueAfter);

                // persist token 合併後的 mass 就是 combinedMass
                // 但我們不知道合併前的確切分配
                // 最佳猜測：如果 MassUpdate 事件只有 combined mass
                // 我們無法準確知道各自的 mass，標記為未知
                console.warn('   ⚠️ Cannot determine exact pre-merge mass distribution');
                console.warn('   Will display with "?" to indicate unknown values');

                // 使用 -1 作為標記，表示值未知
                burnedClass = persistClass; // 假設同 tier（同 class 才能 merge）
                burnedMass = -1; // 標記為未知
                persistMassBeforeMerge = -1; // 標記為未知

            } catch (fallbackError) {
                console.error('   Fallback also failed:', fallbackError.message);
                // 最後的 fallback：全部標記為未知
                burnedClass = 1;
                persistClass = 1;
                burnedMass = -1;
                persistMassBeforeMerge = -1;
            }
        }

        // 獲取合併後 NFT 的圖片
        const imageUrl = await getTokenImageURL(contract, tokenIdPersist);

        // 處理圖片：如果是 SVG data URI 或 Raw SVG，轉換為 PNG Buffer
        let imageBuffer = null;
        let finalImageUrl = imageUrl;

        // 檢查是否為 SVG (Data URI 或 Raw Hex/String)
        const isSvgDataUri = imageUrl && imageUrl.startsWith('data:image/svg+xml');
        const isRawSvg = imageUrl && imageUrl.trim().startsWith('<svg');

        if (isSvgDataUri || isRawSvg) {
            try {
                // 修正：動態導入 sharp，避免在沒有安裝時報錯
                const sharp = (await import('sharp')).default;

                console.log('   🔄 Converting SVG to PNG...');

                let svgBuffer;

                if (isSvgDataUri) {
                    // 處理 base64 編碼的 SVG Data URI
                    if (imageUrl.includes('base64,')) {
                        const base64Data = imageUrl.split('base64,')[1];
                        svgBuffer = Buffer.from(base64Data, 'base64');
                    } else {
                        // 處理 URL 編碼的 SVG Data URI
                        const svgString = decodeURIComponent(imageUrl.split(',')[1]);
                        svgBuffer = Buffer.from(svgString);
                    }
                } else {
                    // 處理 Raw SVG string
                    svgBuffer = Buffer.from(imageUrl);
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
        } else if (imageUrl && !imageUrl.startsWith('http')) {
            // 如果不是 HTTP URL 也不是已知的 SVG 格式，為了安全起見設為 null
            // 避免 Discord.js 報錯 (Invalid URL)
            console.warn('   ⚠️ Unknown image format, skipping:', imageUrl.substring(0, 50));
            finalImageUrl = null;
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
