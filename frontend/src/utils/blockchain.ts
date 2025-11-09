/**
 * Blockchain transaction utilities for MetaMask
 */

import { ethers } from 'ethers'
import { config } from '../config'
import toast from 'react-hot-toast'

/**
 * Sign and submit a transaction to the blockchain
 */
export async function signAndSubmitTransaction(
  signer: ethers.JsonRpcSigner,
  transaction: any
): Promise<string> {
  try {
    // Ensure we're on the correct network
    const network = await signer.provider.getNetwork()
    if (Number(network.chainId) !== config.chainId) {
      throw new Error(`Please switch to ${config.chainName} network`)
    }

    // Sign the transaction
    const signedTx = await signer.signTransaction(transaction)
    
    return signedTx
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('Transaction rejected by user')
    }
    if (error.code === -32603) {
      throw new Error('Transaction failed. Please check your balance and try again.')
    }
    throw new Error(error.message || 'Failed to sign transaction')
  }
}

/**
 * Send a signed transaction to the blockchain
 */
export async function sendSignedTransaction(
  provider: ethers.BrowserProvider,
  signedTxHex: string
): Promise<ethers.TransactionResponse> {
  try {
    const txResponse = await provider.broadcastTransaction(signedTxHex)
    return txResponse
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send transaction')
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(
  provider: ethers.BrowserProvider,
  txHash: string,
  confirmations: number = 1
): Promise<ethers.TransactionReceipt> {
  try {
    const receipt = await provider.waitForTransaction(txHash, confirmations, 300000) // 5 min timeout
    return receipt
  } catch (error: any) {
    throw new Error(error.message || 'Transaction timeout')
  }
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(
  provider: ethers.BrowserProvider,
  txHash: string
): Promise<{
  status: 'pending' | 'success' | 'failed'
  receipt?: ethers.TransactionReceipt
}> {
  try {
    const receipt = await provider.getTransactionReceipt(txHash)
    if (!receipt) {
      return { status: 'pending' }
    }
    return {
      status: receipt.status === 1 ? 'success' : 'failed',
      receipt,
    }
  } catch (error) {
    return { status: 'pending' }
  }
}

/**
 * Format transaction for MetaMask signing
 * Converts backend transaction format to ethers format
 * Note: We don't set 'from' - MetaMask will use the connected account automatically
 */
export function formatTransactionForSigning(tx: any): ethers.TransactionRequest {
  return {
    to: tx.to,
    // Don't set 'from' - MetaMask will use the connected account
    value: tx.value ? BigInt(tx.value) : undefined,
    data: tx.data,
    gasLimit: tx.gas ? BigInt(tx.gas) : undefined,
    gasPrice: tx.gasPrice ? BigInt(tx.gasPrice) : undefined,
    nonce: tx.nonce,
    chainId: tx.chainId,
  }
}

/**
 * Complete transaction flow: sign, submit, and wait for confirmation
 * Uses MetaMask's sendTransaction which automatically signs and sends
 */
export async function executeBlockchainTransaction(
  signer: ethers.JsonRpcSigner,
  transaction: any,
  onProgress?: (status: string) => void
): Promise<{
  txHash: string
  receipt: ethers.TransactionReceipt
  explorerUrl: string
}> {
  try {
    onProgress?.('Preparing transaction...')
    
    // Format transaction for MetaMask
    const formattedTx = formatTransactionForSigning(transaction)
    
    // Get the connected address to verify it matches
    const connectedAddress = await signer.getAddress()
    console.log('🔗 Connected address:', connectedAddress)
    
    // Log transaction details for debugging
    console.log('📝 Transaction details:', {
      to: formattedTx.to,
      from: 'Will use connected address: ' + connectedAddress,
      value: formattedTx.value?.toString(),
      gasLimit: formattedTx.gasLimit?.toString(),
      gasPrice: formattedTx.gasPrice?.toString(),
      chainId: formattedTx.chainId,
      data: formattedTx.data?.substring(0, 20) + '...',
    })
    
    // Verify the transaction 'to' is set (should be contract address)
    if (!formattedTx.to) {
      throw new Error('Transaction "to" address is missing. Contract address may not be configured.')
    }
    
    // Warn if 'to' is the same as connected address (but don't block - might be intentional)
    if (formattedTx.to?.toLowerCase() === connectedAddress.toLowerCase()) {
      console.warn('⚠️ Transaction "to" address is the same as your wallet address. This might be a configuration error.')
    }
    
    // MetaMask will show popup for user to sign
    onProgress?.('Please sign the transaction in MetaMask...')
    
    // Ensure we're on the correct network
    const network = await signer.provider.getNetwork()
    if (Number(network.chainId) !== formattedTx.chainId) {
      throw new Error(`Network mismatch. Please switch to chain ID ${formattedTx.chainId}`)
    }
    
    // sendTransaction automatically signs and sends (MetaMask handles signing)
    console.log('🚀 Sending transaction to MetaMask...')
    console.log('📝 Formatted transaction (from will be set by MetaMask):', {
      to: formattedTx.to,
      from: 'MetaMask will use: ' + connectedAddress,
      value: formattedTx.value?.toString(),
      gasLimit: formattedTx.gasLimit?.toString(),
      gasPrice: formattedTx.gasPrice?.toString(),
      chainId: formattedTx.chainId,
      data: formattedTx.data?.substring(0, 50) + '...',
    })
    
    // Verify signer is valid
    if (!signer || !signer.sendTransaction) {
      throw new Error('Invalid signer. Please reconnect your MetaMask wallet.')
    }
    
    const txResponse = await signer.sendTransaction(formattedTx)
    console.log('✅ Transaction sent:', txResponse.hash)
    const txHash = txResponse.hash
    
    onProgress?.('Transaction submitted. Waiting for confirmation...')
    
    // Wait for confirmation (1 confirmation on testnet is usually enough)
    // Reduced timeout to 60 seconds for better UX (transaction is already submitted)
    const receipt = await signer.provider.waitForTransaction(txHash, 1, 60000)
    
    if (!receipt) {
      throw new Error('Transaction receipt not found')
    }
    
    if (receipt.status !== 1) {
      throw new Error('Transaction failed on blockchain')
    }
    
    const explorerUrl = `${config.blockExplorer}/tx/${txHash}`
    
    return {
      txHash,
      receipt,
      explorerUrl,
    }
  } catch (error: any) {
    if (error.code === 4001 || error.message?.includes('rejected') || error.message?.includes('denied')) {
      throw new Error('Transaction rejected by user')
    }
    if (error.message?.includes('insufficient funds')) {
      throw new Error('Insufficient funds for transaction')
    }
    throw new Error(error.message || 'Transaction failed')
  }
}

/**
 * Get formatted transaction value in MATIC
 */
export function formatValue(value: string | bigint): string {
  try {
    const wei = typeof value === 'string' ? BigInt(value) : value
    const matic = Number(wei) / 1e18
    return matic.toFixed(4)
  } catch {
    return '0'
  }
}

/**
 * Get estimated gas cost in MATIC
 */
export async function getEstimatedGasCost(
  provider: ethers.BrowserProvider,
  transaction: any
): Promise<string> {
  try {
    const gasPrice = await provider.getFeeData()
    const gasLimit = transaction.gas || 21000
    const cost = (gasPrice.gasPrice || 0n) * BigInt(gasLimit)
    return formatValue(cost.toString())
  } catch {
    return '0'
  }
}

