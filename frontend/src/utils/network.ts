import { config } from '../config'
import toast from 'react-hot-toast'

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      isMetaMask?: boolean
    }
  }
}

/**
 * Switch MetaMask to Polygon Amoy testnet
 */
export async function switchToPolygonAmoy(): Promise<boolean> {
  if (!window.ethereum || !window.ethereum.isMetaMask) {
    toast.error('MetaMask is not installed')
    return false
  }

  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${config.chainId.toString(16)}` }],
    })
    return true
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902 || switchError.code === -32603) {
      try {
        // Add the network to MetaMask
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${config.chainId.toString(16)}`,
              chainName: config.chainName,
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18,
              },
              rpcUrls: [config.rpcUrl],
              blockExplorerUrls: [config.blockExplorer],
            },
          ],
        })
        return true
      } catch (addError: any) {
        console.error('Error adding network:', addError)
        toast.error('Failed to add Polygon Amoy network to MetaMask')
        return false
      }
    } else if (switchError.code === 4001) {
      // User rejected the request
      toast.error('Network switch rejected')
      return false
    } else {
      console.error('Error switching network:', switchError)
      toast.error('Failed to switch network')
      return false
    }
  }
}

/**
 * Check if the current network is Polygon Amoy
 */
export async function isCorrectNetwork(): Promise<boolean> {
  if (!window.ethereum) {
    return false
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })
    const currentChainId = parseInt(chainId as string, 16)
    return currentChainId === config.chainId
  } catch (error) {
    console.error('Error checking network:', error)
    return false
  }
}

/**
 * Ensure user is on the correct network, prompt to switch if not
 */
export async function ensureCorrectNetwork(): Promise<boolean> {
  const isCorrect = await isCorrectNetwork()
  
  if (!isCorrect) {
    const shouldSwitch = window.confirm(
      `Please switch to ${config.chainName} (Chain ID: ${config.chainId}) to continue. Click OK to switch automatically.`
    )
    
    if (shouldSwitch) {
      return await switchToPolygonAmoy()
    }
    
    return false
  }
  
  return true
}

