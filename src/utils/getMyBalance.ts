import { ethers } from 'ethers';
import { ENV } from '../config/env';

const USDC_CONTRACT_ADDRESS = ENV.USDC_CONTRACT_ADDRESS;

// Polygon mainnet – avoid "could not detect network" by not auto-detecting
const POLYGON_NETWORK = { chainId: 137, name: 'matic' };

// Try primary RPC first, then fallbacks (public RPCs often rate-limit or block server IPs)
const RPC_URLS = [
    ENV.RPC_URL,
    'https://polygon.llamarpc.com',
    'https://polygon-bor-rpc.publicnode.com',
    'https://rpc.ankr.com/polygon',
].filter(Boolean);

const USDC_ABI = ['function balanceOf(address owner) view returns (uint256)'];

const getMyBalance = async (address: string): Promise<number> => {
    let lastError: unknown;
    for (const rpcUrl of RPC_URLS) {
        try {
            const rpcProvider = new ethers.providers.JsonRpcProvider(rpcUrl, POLYGON_NETWORK);
            const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, USDC_ABI, rpcProvider);
            const balance_usdc = await usdcContract.balanceOf(address);
            const balance_usdc_real = ethers.utils.formatUnits(balance_usdc, 6);
            return parseFloat(balance_usdc_real);
        } catch (error) {
            lastError = error;
            if (rpcUrl !== RPC_URLS[RPC_URLS.length - 1]) {
                console.warn(`RPC ${rpcUrl} failed, trying next...`);
            }
        }
    }
    console.error(`Error fetching balance for ${address}:`, lastError);
    return 0;
};

export default getMyBalance;
