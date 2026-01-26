import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 讀取 ABI
const abiPath = join(__dirname, 'abi', 'Merge.json');
const MERGE_ABI = JSON.parse(readFileSync(abiPath, 'utf8'));

// Merge 合約地址
const MERGE_CONTRACT_ADDRESS = process.env.MERGE_CONTRACT_ADDRESS || '0xc3f8a0f5841abff777d3eefa5047e8d413a1c9ab';

/**
 * 創建 Merge 合約實例
 * @param {ethers.Provider} provider - Ethereum provider
 * @returns {ethers.Contract} Merge contract instance
 */
export function createMergeContract(provider) {
  return new ethers.Contract(
    MERGE_CONTRACT_ADDRESS,
    MERGE_ABI,
    provider
  );
}

export { MERGE_CONTRACT_ADDRESS, MERGE_ABI };
