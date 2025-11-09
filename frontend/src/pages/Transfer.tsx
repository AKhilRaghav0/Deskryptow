import { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { config } from '../config'
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

// Predefined addresses
const MAC_ADDRESS = '0x7710D4Dc6e1A8a6875c6ed91C3c0Bf9BbfEF9FeF'
const LINUX1_ADDRESS = '0xb32D080e919F2749E8155Ab24E25c676076d8397'
const LINUX2_ADDRESS = '0xac654e9fec92194800a79f4fa479c7045c107b2a'

export default function Transfer() {
  const { address, isConnected, signer, provider, connect } = useWallet()
  const [fromAddress, setFromAddress] = useState<string>('')
  const [toAddress, setToAddress] = useState<string>(MAC_ADDRESS)
  const [amount, setAmount] = useState<string>('0.05')
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState<string>('0')
  const [recipientBalance, setRecipientBalance] = useState<string>('0')

  // Quick transfer presets
  const quickTransfers = [
    { label: 'Linux1 → Mac', from: LINUX1_ADDRESS, to: MAC_ADDRESS, amount: '0.05' },
    { label: 'Linux1 → Mac (All)', from: LINUX1_ADDRESS, to: MAC_ADDRESS, amount: '0.1' },
  ]

  useEffect(() => {
    if (isConnected && address && provider) {
      fetchBalance(address)
      if (toAddress) {
        fetchRecipientBalance(toAddress)
      }
    }
  }, [isConnected, address, provider, toAddress])

  const fetchBalance = async (addr: string) => {
    if (!provider) return
    try {
      const balance = await provider.getBalance(addr)
      const balanceEth = ethers.formatEther(balance)
      setBalance(balanceEth)
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const fetchRecipientBalance = async (addr: string) => {
    if (!provider) return
    try {
      const balance = await provider.getBalance(addr)
      const balanceEth = ethers.formatEther(balance)
      setRecipientBalance(balanceEth)
    } catch (error) {
      console.error('Error fetching recipient balance:', error)
    }
  }

  const handleQuickTransfer = (preset: typeof quickTransfers[0]) => {
    setFromAddress(preset.from)
    setToAddress(preset.to)
    setAmount(preset.amount)
  }

  const handleTransfer = async () => {
    if (!isConnected || !address || !signer || !provider) {
      toast.error('Please connect your wallet first')
      await connect()
      return
    }

    // Validate addresses
    if (!ethers.isAddress(fromAddress)) {
      toast.error('Invalid sender address')
      return
    }

    if (!ethers.isAddress(toAddress)) {
      toast.error('Invalid recipient address')
      return
    }

    // Check if connected address matches from address
    if (address.toLowerCase() !== fromAddress.toLowerCase()) {
      toast.error(`Please connect the wallet for: ${fromAddress}`)
      toast.error(`Currently connected: ${address}`)
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    const balanceNum = parseFloat(balance)
    if (amountNum > balanceNum) {
      toast.error(`Insufficient balance. You have ${balanceNum} MATIC`)
      return
    }

    setLoading(true)
    const toastId = toast.loading('Preparing transaction...')

    try {
      // Convert amount to Wei
      const amountWei = ethers.parseEther(amount)

      // Get network info
      const network = await provider.getNetwork()
      const gasPrice = await provider.getFeeData()

      // Build transaction
      const transaction = {
        to: toAddress,
        value: amountWei,
        gasLimit: 21000, // Standard ETH transfer
        gasPrice: gasPrice.gasPrice || undefined,
        chainId: network.chainId,
      }

      toast.loading('Please sign the transaction in MetaMask...', { id: toastId })

      // Send transaction
      const txResponse = await signer.sendTransaction(transaction)
      console.log('Transaction sent:', txResponse.hash)

      toast.loading('Transaction submitted. Waiting for confirmation...', { id: toastId })

      // Wait for confirmation
      const receipt = await provider.waitForTransaction(txResponse.hash, 1, 300000)

      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction failed')
      }

      toast.success(
        <div>
          <div className="font-bold">Transfer successful!</div>
          <a
            href={`${config.blockExplorer}/tx/${txResponse.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline mt-1"
          >
            View on PolygonScan
          </a>
        </div>,
        { id: toastId, duration: 10000 }
      )

      // Refresh balances
      await fetchBalance(address)
      await fetchRecipientBalance(toAddress)

      // Reset form
      setAmount('0.05')
    } catch (error: any) {
      console.error('Transfer error:', error)
      if (error.code === 4001 || error.message?.includes('rejected')) {
        toast.error('Transaction rejected by user', { id: toastId })
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction', { id: toastId })
      } else {
        toast.error(`Transfer failed: ${error.message || 'Unknown error'}`, { id: toastId })
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#EEEEEE] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border-2 border-[#1D1616] shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-[#1D1616] mb-4">Transfer MATIC</h1>
          <p className="text-[#1D1616] opacity-75 mb-6">Connect your wallet to transfer MATIC between addresses</p>
          <button
            onClick={connect}
            className="w-full bg-[#1D1616] text-white py-3 px-6 rounded-xl font-semibold hover:bg-[#2D2D2D] transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#EEEEEE] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#1D1616] mb-4">Transfer MATIC</h1>
          <p className="text-lg text-[#1D1616] opacity-75">Transfer MATIC between your addresses</p>
        </div>

        {/* Quick Transfer Presets */}
        <div className="bg-white rounded-3xl border-2 border-[#1D1616] shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-[#1D1616] mb-4">Quick Transfers</h2>
          <div className="space-y-2">
            {quickTransfers.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickTransfer(preset)}
                className="w-full text-left p-4 rounded-xl border-2 border-[#1D1616] hover:bg-[#EEEEEE] transition-colors"
              >
                <div className="font-semibold text-[#1D1616]">{preset.label}</div>
                <div className="text-sm text-[#1D1616] opacity-75">
                  {preset.amount} MATIC
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Transfer Form */}
        <div className="bg-white rounded-3xl border-2 border-[#1D1616] shadow-xl p-8">
          <div className="space-y-6">
            {/* From Address */}
            <div>
              <label className="block text-sm font-semibold text-[#1D1616] mb-2">
                From Address (Sender)
              </label>
              <input
                type="text"
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 rounded-xl border-2 border-[#1D1616] bg-white text-[#1D1616] focus:outline-none focus:ring-2 focus:ring-[#1D1616]"
              />
              {fromAddress && (
                <div className="mt-2 text-sm text-[#1D1616] opacity-75">
                  Balance: {parseFloat(balance).toFixed(6)} MATIC
                </div>
              )}
              {address && (
                <div className="mt-2 text-xs text-[#1D1616] opacity-50">
                  Connected: {address.slice(0, 6)}...{address.slice(-4)}
                </div>
              )}
            </div>

            {/* To Address */}
            <div>
              <label className="block text-sm font-semibold text-[#1D1616] mb-2">
                To Address (Recipient)
              </label>
              <input
                type="text"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 rounded-xl border-2 border-[#1D1616] bg-white text-[#1D1616] focus:outline-none focus:ring-2 focus:ring-[#1D1616]"
              />
              {toAddress && (
                <div className="mt-2 text-sm text-[#1D1616] opacity-75">
                  Balance: {parseFloat(recipientBalance).toFixed(6)} MATIC
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-[#1D1616] mb-2">
                Amount (MATIC)
              </label>
              <input
                type="number"
                step="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.05"
                className="w-full px-4 py-3 rounded-xl border-2 border-[#1D1616] bg-white text-[#1D1616] focus:outline-none focus:ring-2 focus:ring-[#1D1616]"
              />
            </div>

            {/* Transfer Button */}
            <button
              onClick={handleTransfer}
              disabled={loading || !fromAddress || !toAddress || !amount}
              className="w-full bg-[#1D1616] text-white py-4 px-6 rounded-xl font-semibold hover:bg-[#2D2D2D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowRightIcon className="h-5 w-5" />
                  Transfer MATIC
                </>
              )}
            </button>
          </div>
        </div>

        {/* Address Reference */}
        <div className="mt-6 bg-white rounded-3xl border-2 border-[#1D1616] shadow-xl p-6">
          <h3 className="text-lg font-bold text-[#1D1616] mb-4">Your Addresses</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">Mac (Deployer):</span>{' '}
              <code className="bg-[#EEEEEE] px-2 py-1 rounded">{MAC_ADDRESS}</code>
            </div>
            <div>
              <span className="font-semibold">Linux1 (Freelancer):</span>{' '}
              <code className="bg-[#EEEEEE] px-2 py-1 rounded">{LINUX1_ADDRESS}</code>
            </div>
            <div>
              <span className="font-semibold">Linux2 (Escrow):</span>{' '}
              <code className="bg-[#EEEEEE] px-2 py-1 rounded">{LINUX2_ADDRESS}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

