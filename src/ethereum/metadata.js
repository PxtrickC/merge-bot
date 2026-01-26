/**
 * NFT Metadata Utilities
 * 處理 NFT metadata 獲取和圖片 URL 解析
 */

/**
 * 從 tokenURI 獲取 NFT 圖片 URL
 * @param {ethers.Contract} contract - Merge contract instance
 * @param {string|number} tokenId - Token ID
 * @returns {Promise<string|null>} Image URL or null if failed
 */
export async function getTokenImageURL(contract, tokenId) {
    try {
        console.log(`   📸 Fetching metadata for token #${tokenId}...`);

        // 調用合約的 tokenURI 函數
        const tokenURI = await contract.tokenURI(tokenId);

        if (!tokenURI) {
            console.warn('   ⚠️  No tokenURI returned');
            return null;
        }

        // 解析 metadata
        let metadata;

        // 處理 data URI (Base64 encoded JSON)
        if (tokenURI.startsWith('data:application/json;base64,')) {
            const base64Data = tokenURI.replace('data:application/json;base64,', '');
            const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
            metadata = JSON.parse(jsonString);
        }
        // 處理 data URI (plain JSON)
        else if (tokenURI.startsWith('data:application/json,')) {
            const jsonString = decodeURIComponent(tokenURI.replace('data:application/json,', ''));
            metadata = JSON.parse(jsonString);
        }
        // 處理 HTTP/HTTPS URL
        else if (tokenURI.startsWith('http://') || tokenURI.startsWith('https://')) {
            const response = await fetch(tokenURI);
            metadata = await response.json();
        }
        // 處理 IPFS URL
        else if (tokenURI.startsWith('ipfs://')) {
            const ipfsHash = tokenURI.replace('ipfs://', '');
            const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
            metadata = await response.json();
        }
        else {
            console.warn('   ⚠️  Unknown tokenURI format:', tokenURI.substring(0, 50));
            return null;
        }

        // 從 metadata 中提取圖片 URL
        if (!metadata.image) {
            console.warn('   ⚠️  No image field in metadata');
            return null;
        }

        let imageUrl = metadata.image;

        // 處理 IPFS 圖片 URL
        if (imageUrl.startsWith('ipfs://')) {
            const ipfsHash = imageUrl.replace('ipfs://', '');
            imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
        }

        console.log(`   ✅ Image URL retrieved: ${imageUrl.substring(0, 100)}...`);
        return imageUrl;

    } catch (error) {
        console.error('   ❌ Error fetching token metadata:', error.message);
        return null;
    }
}
