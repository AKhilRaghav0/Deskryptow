// Environment configuration
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  chainId: parseInt(import.meta.env.VITE_CHAIN_ID || '80001'),
  chainName: import.meta.env.VITE_CHAIN_NAME || 'Polygon Mumbai',
  rpcUrl: import.meta.env.VITE_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
  escrowContractAddress: import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || '',
  blockExplorer: import.meta.env.VITE_BLOCK_EXPLORER || 'https://mumbai.polygonscan.com',
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
