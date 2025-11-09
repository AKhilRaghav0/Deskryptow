import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import {
  connectMetaMask,
  isMetaMaskInstalled,
  getCurrentAccount,
  onAccountsChanged,
  onChainChanged,
  formatAddress,
  openMetaMaskInstallation,
  signMessage,
} from '../utils/wallet'
import { switchToPolygonAmoy, isCorrectNetwork, ensureCorrectNetwork } from '../utils/network'
import { config } from '../config'
import axios from 'axios'

interface WalletContextType {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  token: string | null
  connect: () => Promise<void>
  disconnect: () => void
  formatAddress: (address: string) => string
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [token, setToken] = useState<string | null>(null)

  // Check for existing connection on mount
  useEffect(() => {
    checkExistingConnection()
  }, [])

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
        toast.error('Wallet disconnected')
      } else if (accounts[0] !== address) {
        setAddress(accounts[0])
        toast.success('Account changed')
      }
    }

    const cleanup = onAccountsChanged(handleAccountsChanged)
    return cleanup
  }, [address])

  // Listen for chain changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return

    const handleChainChanged = () => {
      window.location.reload()
    }

    const cleanup = onChainChanged(handleChainChanged)
    return cleanup
  }, [])

  const checkExistingConnection = async () => {
    try {
      const currentAccount = await getCurrentAccount()
      if (currentAccount) {
        const provider = new ethers.BrowserProvider(window.ethereum!)
        const signer = await provider.getSigner()
        setAddress(currentAccount)
        setProvider(provider)
        setSigner(signer)
        
        // Check for stored token
        const storedToken = localStorage.getItem('auth_token')
        if (storedToken) {
          setToken(storedToken)
        }
      }
    } catch (error) {
      console.error('Error checking existing connection:', error)
    }
  }

  const connect = async () => {
    // Check if MetaMask is installed
    if (!isMetaMaskInstalled()) {
      toast.error('MetaMask is not installed', {
        duration: 5000,
        action: {
          label: 'Install MetaMask',
          onClick: () => openMetaMaskInstallation(),
        },
      })
      return
    }

    setIsConnecting(true)
    
    try {
      // Check and switch to correct network (Polygon Amoy)
      const isCorrect = await isCorrectNetwork()
      if (!isCorrect) {
        const switched = await switchToPolygonAmoy()
        if (!switched) {
          setIsConnecting(false)
          return
        }
        // Wait a moment for network switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Connect to MetaMask
      const { address: connectedAddress, provider: connectedProvider, signer: connectedSigner } = await connectMetaMask()
      
      setAddress(connectedAddress)
      setProvider(connectedProvider)
      setSigner(connectedSigner)

      // Get nonce from backend
      const nonceResponse = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/auth/nonce/${connectedAddress}`
      )
      const message = nonceResponse.data.nonce

      // Sign message
      const signature = await signMessage(connectedSigner, message)

      // Authenticate with backend
      const authResponse = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/auth/wallet-login`,
        {
          wallet_address: connectedAddress,
          message: message,
          signature: signature,
        }
      )

      const { access_token } = authResponse.data
      setToken(access_token)
      localStorage.setItem('auth_token', access_token)
      localStorage.setItem('wallet_address', connectedAddress)

      toast.success('Wallet connected successfully!', {
        duration: 3000,
        icon: '✅',
      })
    } catch (error: any) {
      console.error('Connection error:', error)
      
      // Reset state on error
      setAddress(null)
      setProvider(null)
      setSigner(null)
      setToken(null)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('wallet_address')
      
      if (error.message?.includes('not installed') || error.message?.includes('MetaMask')) {
        toast.error('MetaMask is not installed', {
          duration: 5000,
          icon: '🔒',
          action: {
            label: 'Install MetaMask',
            onClick: () => openMetaMaskInstallation(),
          },
        })
      } else if (error.message?.includes('rejected') || error.code === 4001) {
        toast.error('Signature request was rejected', {
          duration: 3000,
          icon: '❌',
        })
      } else if (error.response?.status === 401) {
        toast.error('Invalid signature. Please try connecting again.', {
          duration: 4000,
          icon: '🔐',
        })
      } else if (error.response?.status === 500) {
        const errorDetail = error.response?.data?.detail || 'Server error'
        toast.error(`Authentication failed: ${errorDetail}`, {
          duration: 5000,
          icon: '⚠️',
        })
        console.error('Full error:', error.response?.data)
      } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || !error.response) {
        toast.error('Cannot connect to server. Please check your connection.', {
          duration: 4000,
          icon: '🌐',
        })
      } else {
        toast.error(error.response?.data?.detail || error.message || 'Failed to connect wallet', {
          duration: 4000,
          icon: '❌',
        })
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setAddress(null)
    setProvider(null)
    setSigner(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('wallet_address')
    toast.success('Wallet disconnected')
  }

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        isConnecting,
        provider,
        signer,
        token,
        connect,
        disconnect,
        formatAddress,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

