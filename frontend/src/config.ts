// Environment configuration - Polygon Amoy Testnet
// Auto-detect API URL based on current hostname
const getApiUrl = () => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // If running on localhost, use localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000'
  }
  
  // Otherwise, use the same hostname as the frontend (for network access)
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    return `${protocol}//${hostname}:8000`
  }
  
  // Fallback
  return 'http://localhost:8000'
}

export const config = {
  apiUrl: getApiUrl(),
  chainId: parseInt(import.meta.env.VITE_CHAIN_ID || '80002'),
  chainName: import.meta.env.VITE_CHAIN_NAME || 'Polygon Amoy',
  rpcUrl: import.meta.env.VITE_RPC_URL || 'https://rpc-amoy.polygon.technology',
  escrowContractAddress: import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || '',
  blockExplorer: import.meta.env.VITE_BLOCK_EXPLORER || 'https://amoy.polygonscan.com',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
}

export const PLATFORM_FEE_PERCENTAGE = 2

export const JOB_CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'UI/UX Design',
  'Blockchain',
  'AI/ML',
  'Data Science',
  'Content Writing',
  'Marketing',
  'Video Editing',
  'Other',
]

export const SKILLS = [
  'React',
  'Node.js',
  'Python',
  'Solidity',
  'TypeScript',
  'JavaScript',
  'Figma',
  'Adobe XD',
  'TensorFlow',
  'PyTorch',
  'PostgreSQL',
  'MongoDB',
  'AWS',
  'GCP',
  'Docker',
  'Kubernetes',
]
