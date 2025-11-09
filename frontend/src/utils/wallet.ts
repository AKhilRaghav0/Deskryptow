import { ethers } from 'ethers'

export interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
}

// Check if MetaMask is installed
export function isMetaMaskInstalled(): boolean {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
}

// Get MetaMask provider
export function getMetaMaskProvider(): ethers.BrowserProvider | null {
  if (!isMetaMaskInstalled()) {
    return null
  }
  return new ethers.BrowserProvider(window.ethereum)
}

// Connect to MetaMask
export async function connectMetaMask(): Promise<{
  address: string
  provider: ethers.BrowserProvider
  signer: ethers.JsonRpcSigner
}> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.')
  }

  try {
    const provider = getMetaMaskProvider()!
    
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' })
    
    // Get signer
    const signer = await provider.getSigner()
    const address = await signer.getAddress()
    
    return {
      address,
      provider,
      signer,
    }
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('Please connect to MetaMask.')
    }
    throw new Error(`Failed to connect: ${error.message}`)
  }
}

// Sign a message
export async function signMessage(
  signer: ethers.JsonRpcSigner,
  message: string
): Promise<string> {
  try {
    const signature = await signer.signMessage(message)
    return signature
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('Message signature rejected.')
    }
    throw new Error(`Failed to sign message: ${error.message}`)
  }
}

// Get the current connected account
export async function getCurrentAccount(): Promise<string | null> {
  if (!isMetaMaskInstalled()) {
    return null
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    return accounts.length > 0 ? accounts[0] : null
  } catch (error) {
    console.error('Error getting current account:', error)
    return null
  }
}

// Format address for display
export function formatAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Open MetaMask installation page
export function openMetaMaskInstallation(): void {
  window.open('https://metamask.io/download/', '_blank')
}

// Listen for account changes
export function onAccountsChanged(callback: (accounts: string[]) => void): () => void {
  if (!isMetaMaskInstalled()) {
    return () => {}
  }

  window.ethereum.on('accountsChanged', callback)
  
  return () => {
    window.ethereum.removeListener('accountsChanged', callback)
  }
}

// Listen for chain changes
export function onChainChanged(callback: (chainId: string) => void): () => void {
  if (!isMetaMaskInstalled()) {
    return () => {}
  }

  window.ethereum.on('chainChanged', callback)
  
  return () => {
    window.ethereum.removeListener('chainChanged', callback)
  }
}

// Declare window.ethereum type
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, callback: (...args: any[]) => void) => void
      removeListener: (event: string, callback: (...args: any[]) => void) => void
      isMetaMask?: boolean
    }
  }
}

