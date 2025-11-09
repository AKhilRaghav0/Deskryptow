import { useState } from 'react'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useWallet } from '../contexts/WalletContext'
import { config } from '../config'
import axios from 'axios'
import toast from 'react-hot-toast'
import { executeBlockchainTransaction } from '../utils/blockchain'

interface TestLog {
  timestamp: string
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
}

export default function TestJobCreation() {
  const { address, isConnected, connect, signer, provider } = useWallet()
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<TestLog[]>([])
  const [testJobId, setTestJobId] = useState<string | null>(null)
  const [blockchainJobId, setBlockchainJobId] = useState<number | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [transferAddress, setTransferAddress] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferring, setTransferring] = useState(false)

  const addLog = (type: TestLog['type'], message: string) => {
    const log: TestLog = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    }
    setLogs(prev => [...prev, log])
    console.log(`[${type.toUpperCase()}] ${message}`)
  }

  const clearLogs = () => {
    setLogs([])
    setTestJobId(null)
    setBlockchainJobId(null)
    setTxHash(null)
  }

  const testConnection = async () => {
    addLog('info', 'Testing wallet connection...')
    
    if (!isConnected || !address) {
      addLog('error', 'Wallet not connected')
      toast.error('Please connect your wallet first')
      return
    }
    
    addLog('success', `Wallet connected: ${address}`)
    
    if (!signer) {
      addLog('error', 'Signer not available')
      toast.error('Signer not available. Please reconnect wallet.')
      return
    }
    
    addLog('success', 'Signer available')
    
    if (provider) {
      try {
        const network = await provider.getNetwork()
        addLog('info', `Network: Chain ID ${network.chainId}`)
        addLog('info', `Expected: Chain ID ${config.chainId}`)
        
        if (Number(network.chainId) !== config.chainId) {
          addLog('warning', `Network mismatch! Please switch to Polygon Amoy (Chain ID ${config.chainId})`)
          toast.error(`Please switch to Polygon Amoy network (Chain ID ${config.chainId})`)
        } else {
          addLog('success', 'Network is correct (Polygon Amoy)')
        }
      } catch (error: any) {
        addLog('error', `Network check failed: ${error.message}`)
      }
    }
  }

  const testJobCreation = async () => {
    if (!isConnected || !address || !signer) {
      addLog('error', 'Wallet not connected or signer not available')
      toast.error('Please connect your wallet first')
      return
    }

    setLoading(true)
    clearLogs()
    addLog('info', '🚀 Starting job creation test...')

    try {
      // Step 1: Create job in database
      addLog('info', 'Step 1: Creating job in database...')
      const deadlineDate = new Date()
      deadlineDate.setDate(deadlineDate.getDate() + 7) // 7 days from now

      const jobResponse = await axios.post(
        `${config.apiUrl}/api/v1/jobs/`,
        {
          title: 'Test Job - Blockchain Integration',
          description: 'This is a test job to verify blockchain integration and MetaMask popup functionality.',
          category: 'Blockchain',
          skills_required: [],
          budget: 0.01, // Small amount for testing
          deadline: deadlineDate.toISOString(),
          tags: ['test', 'blockchain'],
          ipfs_hash: null,
        },
        {
          params: { client_address: address },
        }
      )

      const jobId = jobResponse.data.id
      const ipfsHash = jobResponse.data.ipfs_hash || ''
      setTestJobId(jobId)
      addLog('success', `✅ Job created in database: ${jobId}`)
      addLog('info', `IPFS Hash: ${ipfsHash || 'None'}`)

      // Step 2: Build blockchain transaction
      addLog('info', 'Step 2: Building blockchain transaction...')
      const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000)

      const blockchainResponse = await axios.post(
        `${config.apiUrl}/api/v1/jobs/blockchain/create`,
        {
          title: 'Test Job - Blockchain Integration',
          ipfs_hash: ipfsHash || 'test_hash',
          deadline: deadlineTimestamp,
          amount_eth: 0.01,
        },
        {
          params: { client_address: address },
        }
      )

      addLog('success', '✅ Blockchain transaction built')
      addLog('info', `Transaction details: ${JSON.stringify(blockchainResponse.data.transaction, null, 2).substring(0, 200)}...`)

      const transaction = blockchainResponse.data.transaction

      if (!transaction) {
        throw new Error('No transaction received from backend')
      }

      // Step 3: Execute transaction (this should trigger MetaMask popup)
      addLog('info', 'Step 3: Executing blockchain transaction...')
      addLog('warning', '⚠️ MetaMask popup should appear now!')
      toast.loading('Please sign the transaction in MetaMask...', { id: 'test-tx' })

      const result = await executeBlockchainTransaction(
        signer,
        transaction,
        (status) => {
          addLog('info', `Status: ${status}`)
          toast.loading(status, { id: 'test-tx' })
        }
      )

      setTxHash(result.txHash)
      addLog('success', `✅ Transaction sent: ${result.txHash}`)
      addLog('info', `Explorer URL: ${result.explorerUrl}`)

      // Step 4: Submit transaction to backend
      addLog('info', 'Step 4: Linking transaction to job...')
      try {
        const submitResponse = await axios.post(
          `${config.apiUrl}/api/v1/jobs/blockchain/submit-tx`,
          null,
          {
            params: {
              signed_tx_hex: result.txHash,
              job_id: jobId,
            },
          }
        )

        if (submitResponse.data.blockchain_job_id) {
          setBlockchainJobId(submitResponse.data.blockchain_job_id)
          addLog('success', `✅ Job linked to blockchain: Job ID ${submitResponse.data.blockchain_job_id}`)
        } else {
          addLog('warning', '⚠️ Could not extract blockchain job ID from transaction')
        }
      } catch (e: any) {
        addLog('warning', `⚠️ Could not link blockchain job ID: ${e.message}`)
      }

      toast.success('✅ Test completed successfully!', { id: 'test-tx' })
      toast.success(
        <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer" className="underline">
          View on PolygonScan
        </a>,
        { duration: 10000 }
      )

      addLog('success', '🎉 All tests passed!')
    } catch (error: any) {
      console.error('Test error:', error)
      addLog('error', `❌ Test failed: ${error.message}`)
      
      if (error.response) {
        addLog('error', `Backend error: ${error.response.status} - ${error.response.data?.detail || JSON.stringify(error.response.data)}`)
      }
      
      if (error.code === 4001 || error.message?.includes('rejected')) {
        addLog('error', 'Transaction was rejected by user')
        toast.error('Transaction rejected. Test failed.', { id: 'test-tx' })
      } else if (error.message?.includes('signer') || error.message?.includes('MetaMask')) {
        addLog('error', 'MetaMask error - please reconnect wallet')
        toast.error(`MetaMask error: ${error.message}`, { id: 'test-tx', duration: 8000 })
      } else {
        toast.error(`Test failed: ${error.message}`, { id: 'test-tx', duration: 8000 })
      }
    } finally {
      setLoading(false)
    }
  }

  const sendTokens = async () => {
    if (!isConnected || !address || !signer || !provider) {
      addLog('error', 'Wallet not connected or signer not available')
      toast.error('Please connect your wallet first')
      return
    }

    if (!transferAddress || !transferAmount) {
      addLog('error', 'Please enter recipient address and amount')
      toast.error('Please enter recipient address and amount')
      return
    }

    const amount = parseFloat(transferAmount)
    if (isNaN(amount) || amount <= 0) {
      addLog('error', 'Invalid amount. Please enter a positive number.')
      toast.error('Invalid amount')
      return
    }

    setTransferring(true)
    addLog('info', `🚀 Starting token transfer...`)
    addLog('info', `From: ${address}`)
    addLog('info', `To: ${transferAddress}`)
    addLog('info', `Amount: ${amount} MATIC`)

    try {
      // Validate that recipient is not the same as sender
      if (transferAddress.toLowerCase() === address.toLowerCase()) {
        throw new Error('Cannot send to your own address')
      }

      // Validate that recipient is not the escrow contract
      if (transferAddress.toLowerCase() === config.escrowContractAddress.toLowerCase()) {
        throw new Error('Cannot send to escrow contract address. Please use a different recipient address.')
      }

      // Validate address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(transferAddress)) {
        throw new Error('Invalid recipient address format')
      }

      // Convert MATIC to Wei
      const amountWei = BigInt(Math.floor(amount * 1e18))

      // Check balance of connected wallet
      const balance = await provider.getBalance(address)
      if (balance < amountWei) {
        throw new Error(`Insufficient balance. You have ${(Number(balance) / 1e18).toFixed(4)} MATIC`)
      }

      addLog('info', `Balance check passed: ${(Number(balance) / 1e18).toFixed(4)} MATIC available`)
      
      // Verify signer address matches connected wallet
      const signerAddress = await signer.getAddress()
      addLog('info', `Signer address: ${signerAddress}`)
      addLog('info', `Connected address: ${address}`)
      
      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error(`Signer address (${signerAddress}) does not match connected wallet (${address}). Please reconnect your wallet.`)
      }

      addLog('info', 'Preparing transaction from your wallet...')

      // Build transaction - DO NOT set 'from' - let MetaMask/signer determine it
      // Setting 'from' can cause MetaMask to use wrong address
      const transaction = {
        to: transferAddress,
        value: amountWei,
        // Let MetaMask estimate gas automatically
      }

      addLog('info', `Transaction: From ${address} → To ${transferAddress}`)
      addLog('info', 'Please sign the transaction in MetaMask...')
      toast.loading('Please sign the transaction in MetaMask...', { id: 'transfer-tx' })

      // Send transaction - signer will use the connected wallet address
      // MetaMask will automatically use the account that the signer is connected to
      const txResponse = await signer.sendTransaction(transaction)
      addLog('success', `Transaction sent! Hash: ${txResponse.hash}`)
      toast.success('Transaction sent!', { id: 'transfer-tx' })

      addLog('info', 'Waiting for confirmation...')
      const receipt = await provider.waitForTransaction(txResponse.hash, 1, 300000)

      if (receipt && receipt.status === 1) {
        addLog('success', '✅ Transfer successful!')
        addLog('info', `View on explorer: ${config.blockExplorer}/tx/${txResponse.hash}`)
        toast.success('Transfer successful!', { id: 'transfer-tx' })
        
        // Clear form
        setTransferAddress('')
        setTransferAmount('')
      } else {
        throw new Error('Transaction failed on blockchain')
      }
    } catch (error: any) {
      addLog('error', `❌ Transfer failed: ${error.message}`)
      
      if (error.code === 4001 || error.message?.includes('rejected')) {
        toast.error('Transaction rejected by user', { id: 'transfer-tx' })
      } else if (error.message?.includes('insufficient')) {
        toast.error(error.message, { id: 'transfer-tx', duration: 8000 })
      } else {
        toast.error(`Transfer failed: ${error.message}`, { id: 'transfer-tx', duration: 8000 })
      }
    } finally {
      setTransferring(false)
    }
  }

  const getLogIcon = (type: TestLog['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-600" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
      default:
        return <ArrowPathIcon className="h-5 w-5 text-blue-600" />
    }
  }

  const getLogColor = (type: TestLog['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900'
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#EEEEEE]">
      {/* Header */}
      <section className="w-full py-16 bg-white border-b-2 border-[#1D1616]">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#1D1616] text-white text-sm font-bold mb-6 border-2 border-[#1D1616]">
            <SparklesIcon className="h-4 w-4 mr-2.5 text-[#D84040]" />
            Test Mode
          </div>
          <h1 className="text-6xl sm:text-7xl font-display font-bold text-[#1D1616] mb-4">
            Job Creation Test
          </h1>
          <p className="text-2xl text-[#1D1616] max-w-3xl">
            Test job creation and MetaMask blockchain transaction flow
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="w-full py-16">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel - Controls */}
            <div className="space-y-6">
              {/* Connection Status */}
              <div className="bg-white rounded-3xl shadow-elevated p-8 border-2 border-[#1D1616]">
                <h2 className="text-2xl font-display font-bold text-[#1D1616] mb-6">Connection Status</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#EEEEEE] rounded-2xl border-2 border-[#1D1616]">
                    <span className="font-bold text-[#1D1616]">Wallet Connected:</span>
                    <span className={`font-bold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isConnected ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  {address && (
                    <div className="p-4 bg-[#EEEEEE] rounded-2xl border-2 border-[#1D1616]">
                      <span className="font-bold text-[#1D1616] block mb-2">Address:</span>
                      <span className="font-mono text-sm text-[#D84040] break-all">{address}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-4 bg-[#EEEEEE] rounded-2xl border-2 border-[#1D1616]">
                    <span className="font-bold text-[#1D1616]">Signer Available:</span>
                    <span className={`font-bold ${signer ? 'text-green-600' : 'text-red-600'}`}>
                      {signer ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  {!isConnected && (
                    <button
                      onClick={connect}
                      className="w-full px-6 py-4 rounded-2xl text-lg font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all shadow-lg hover:scale-105 border-2 border-[#D84040]"
                    >
                      Connect MetaMask
                    </button>
                  )}
                </div>
              </div>

              {/* Test Controls */}
              <div className="bg-white rounded-3xl shadow-elevated p-8 border-2 border-[#1D1616]">
                <h2 className="text-2xl font-display font-bold text-[#1D1616] mb-6">Test Controls</h2>
                <div className="space-y-4">
                  <button
                    onClick={testConnection}
                    disabled={loading}
                    className="w-full px-6 py-4 rounded-2xl text-lg font-bold text-white bg-[#1D1616] hover:bg-[#2A1F1F] transition-all shadow-lg hover:scale-105 border-2 border-[#1D1616] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Test Connection
                  </button>
                  <button
                    onClick={testJobCreation}
                    disabled={loading || !isConnected || !signer}
                    className="w-full px-6 py-4 rounded-2xl text-lg font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all shadow-lg hover:scale-105 border-2 border-[#D84040] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Testing...' : 'Test Job Creation'}
                  </button>
                  <button
                    onClick={clearLogs}
                    disabled={loading}
                    className="w-full px-6 py-4 rounded-2xl text-lg font-bold text-[#1D1616] bg-[#EEEEEE] hover:bg-[#E5E5E5] transition-all shadow-lg hover:scale-105 border-2 border-[#1D1616] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear Logs
                  </button>
                </div>
              </div>

              {/* Token Transfer */}
              <div className="bg-white rounded-3xl shadow-elevated p-8 border-2 border-[#1D1616]">
                <h2 className="text-2xl font-display font-bold text-[#1D1616] mb-2">Send Tokens Back</h2>
                <p className="text-sm text-[#1D1616] opacity-70 mb-6">
                  Transfer MATIC tokens to another wallet for testing
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[#1D1616] mb-2">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      value={transferAddress}
                      onChange={(e) => setTransferAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-4 py-3 rounded-2xl border-2 border-[#1D1616] bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D84040]"
                      disabled={transferring || !isConnected}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#1D1616] mb-2">
                      Amount (MATIC)
                    </label>
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="0.1"
                      step="0.001"
                      min="0"
                      className="w-full px-4 py-3 rounded-2xl border-2 border-[#1D1616] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D84040]"
                      disabled={transferring || !isConnected}
                    />
                  </div>
                  <button
                    onClick={sendTokens}
                    disabled={transferring || !isConnected || !signer || !transferAddress || !transferAmount}
                    className="w-full px-6 py-4 rounded-2xl text-lg font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all shadow-lg hover:scale-105 border-2 border-[#D84040] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {transferring ? 'Sending...' : 'Send Tokens'}
                  </button>
                </div>
              </div>

              {/* Test Results */}
              {(testJobId || blockchainJobId || txHash) && (
                <div className="bg-white rounded-3xl shadow-elevated p-8 border-2 border-[#1D1616]">
                  <h2 className="text-2xl font-display font-bold text-[#1D1616] mb-6">Test Results</h2>
                  <div className="space-y-3">
                    {testJobId && (
                      <div className="p-4 bg-green-50 rounded-2xl border-2 border-green-200">
                        <span className="font-bold text-green-900 block mb-1">Database Job ID:</span>
                        <span className="font-mono text-sm text-green-700 break-all">{testJobId}</span>
                      </div>
                    )}
                    {blockchainJobId && (
                      <div className="p-4 bg-green-50 rounded-2xl border-2 border-green-200">
                        <span className="font-bold text-green-900 block mb-1">Blockchain Job ID:</span>
                        <span className="font-mono text-sm text-green-700">{blockchainJobId}</span>
                      </div>
                    )}
                    {txHash && (
                      <div className="p-4 bg-green-50 rounded-2xl border-2 border-green-200">
                        <span className="font-bold text-green-900 block mb-1">Transaction Hash:</span>
                        <a
                          href={`${config.blockExplorer}/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm text-green-700 break-all hover:underline"
                        >
                          {txHash}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Logs */}
            <div className="bg-white rounded-3xl shadow-elevated p-8 border-2 border-[#1D1616]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-[#1D1616]">Test Logs</h2>
                <span className="text-sm font-bold text-[#1D1616] bg-[#EEEEEE] px-3 py-1 rounded-full border-2 border-[#1D1616]">
                  {logs.length} logs
                </span>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {logs.length === 0 ? (
                  <div className="text-center py-12 text-[#1D1616] opacity-50">
                    <p className="text-lg">No logs yet. Run a test to see logs here.</p>
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-2xl border-2 ${getLogColor(log.type)} flex items-start gap-3`}
                    >
                      <div className="flex-shrink-0 mt-0.5">{getLogIcon(log.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold opacity-70">{log.timestamp}</span>
                          <span className="text-xs font-bold uppercase opacity-70">{log.type}</span>
                        </div>
                        <p className="text-sm font-medium break-words whitespace-pre-wrap">{log.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

