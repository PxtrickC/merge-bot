import { sendMergeNotification } from '../discord/client.js';
import { MERGE_CONTRACT_ADDRESS } from '../ethereum/contract.js';

/**
 * 處理 MassUpdate 事件
 * @param {Object} event - Event object from ethers
 * @param {ethers.Contract} contract - Merge contract instance
 */
export async function handleMergeEvent(event, contract) {
    try {
        const tokenIdBurned = event.args.tokenIdBurned;
        const tokenIdPersist = event.args.tokenIdPersist;
        const mass = event.args.mass;
        const transactionHash = event.transactionHash;

        console.log('\n🔔 New Merge Event Detected!');
        console.log(`   Token Burned: #${tokenIdBurned}`);
        console.log(`   Token Persist: #${tokenIdPersist}`);
        console.log(`   Combined Mass: ${mass}`);
        console.log(`   TX Hash: ${transactionHash}`);

        // 查詢當前總供應量
        const totalSupply = await contract.totalSupply();
        console.log(`   Total Supply: ${totalSupply}`);

        // 準備通知資料
        const eventData = {
            tokenIdBurned: tokenIdBurned.toString(),
            tokenIdPersist: tokenIdPersist.toString(),
            mass: Number(mass),
            totalSupply: Number(totalSupply),
            transactionHash: transactionHash,
            contractAddress: MERGE_CONTRACT_ADDRESS,
            timestamp: new Date().toISOString()
        };

        // 發送 Discord 通知
        await sendMergeNotification(eventData);

    } catch (error) {
        console.error('❌ Error handling merge event:', error);
    }
}
