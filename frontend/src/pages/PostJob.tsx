import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircleIcon, SparklesIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useWallet } from '../contexts/WalletContext'
import toast from 'react-hot-toast'
import axios from 'axios'
import { config } from '../config'
import MarkdownEditor from '../components/MarkdownEditor'
import CustomDropdown from '../components/CustomDropdown'
import { executeBlockchainTransaction } from '../utils/blockchain'

export default function PostJob() {
  const navigate = useNavigate()
  const { address, isConnected, connect, signer } = useWallet()
  // Linux2 escrow address (pre-filled for convenience)
  const LINUX2_ESCROW_ADDRESS = '0xac654e9fec92194800a79f4fa479c7045c107b2a'
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    category: '',
    deadline: '',
    tags: [] as string[],
    escrow_address: LINUX2_ESCROW_ADDRESS, // Pre-fill with Linux2 address
    allow_escrow_revert: false,
  })
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Redirect if not connected
    if (!isConnected) {
      toast.error('Please connect your MetaMask wallet to post a job', {
        duration: 5000,
      })
    }
  }, [isConnected])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected || !address) {
      toast.error('Please connect your MetaMask wallet first')
      connect()
      return
    }

    // Validate form
    if (!formData.title.trim() || !formData.description.trim() || !formData.category || !formData.budget || !formData.deadline) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate deadline is in the future
    const deadlineDate = new Date(formData.deadline)
    if (deadlineDate <= new Date()) {
      toast.error('Deadline must be in the future')
      return
    }

    // Validate budget
    const budget = parseFloat(formData.budget)
    if (isNaN(budget) || budget < 0.001) {
      toast.error('Budget must be at least 0.001 MATIC')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      
      if (!signer) {
        toast.error('Please connect your wallet')
        connect()
        return
      }
      
      // Step 1: Create job in database (IPFS upload happens automatically)
      const jobResponse = await axios.post(
        `${config.apiUrl}/api/v1/jobs/`,
        {
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          skills_required: [],
          budget: budget,
          deadline: deadlineDate.toISOString(),
          tags: formData.tags || [],
          ipfs_hash: null, // Will be auto-uploaded by backend
          escrow_address: formData.escrow_address.trim() || null,
          allow_escrow_revert: formData.allow_escrow_revert,
        },
        {
          params: { client_address: address },
          headers: token ? {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          } : {
            'Content-Type': 'application/json',
          },
        }
      )

      const jobId = jobResponse.data.id
      const ipfsHash = jobResponse.data.ipfs_hash || 'QmPlaceholderHashForJobDetails' // Use placeholder if IPFS not configured
      
      toast.success('Job created in database!')
      
      // Step 2: Build and execute blockchain transaction
      try {
        // Verify signer is available
        if (!signer) {
          throw new Error('MetaMask signer not available. Please reconnect your wallet.')
        }
        
        console.log('🔍 Signer available:', !!signer)
        console.log('🔍 Address:', address)
        console.log('🔍 Budget:', budget)
        console.log('🔍 IPFS Hash:', ipfsHash)
        
        const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000)
        
        console.log('📝 Building blockchain transaction...')
        
        // Build blockchain transaction
        const blockchainResponse = await axios.post(
          `${config.apiUrl}/api/v1/jobs/blockchain/create`,
          {
            title: formData.title.trim(),
            ipfs_hash: ipfsHash, // Backend will use placeholder if empty
            deadline: deadlineTimestamp,
            amount_eth: budget, // Note: backend expects amount_eth but it's actually MATIC
          },
          {
            params: { client_address: address },
          }
        )

        console.log('✅ Blockchain transaction built:', blockchainResponse.data)
        
        const transaction = blockchainResponse.data.transaction
        
        if (!transaction) {
          throw new Error('No transaction received from backend')
        }
        
        console.log('📝 Transaction details:', {
          to: transaction.to,
          from: transaction.from,
          value: transaction.value,
          gas: transaction.gas,
          chainId: transaction.chainId,
        })
        
        // Step 3: Sign and submit transaction
        toast.loading('Please sign the transaction in MetaMask...', { id: 'blockchain-tx' })
        
        console.log('🚀 Calling executeBlockchainTransaction...')
        
        const result = await executeBlockchainTransaction(
          signer,
          transaction,
          (status) => {
            console.log('📊 Status update:', status)
            toast.loading(status, { id: 'blockchain-tx' })
          }
        )
        
        console.log('✅ Transaction result:', result)
        
        // Step 4: Update job with blockchain job ID (backend will extract from receipt)
        // The transaction is already submitted, we just need to link it
        // Backend can get the job ID from the event logs
        try {
          await axios.post(
            `${config.apiUrl}/api/v1/jobs/blockchain/submit-tx`,
            null,
            {
              params: {
                signed_tx_hex: result.txHash, // Backend will get receipt from hash
                job_id: jobId,
              },
            }
          )
        } catch (e) {
          // If this fails, the transaction is still on blockchain
          console.warn('Could not link blockchain job ID:', e)
        }
        
        toast.success('Job created on blockchain!', { id: 'blockchain-tx' })
        toast.success(
          <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer" className="underline">
            View on PolygonScan
          </a>,
          { duration: 5000 }
        )
      } catch (blockchainError: any) {
        // Don't fail the whole job creation if blockchain fails
        console.error('❌ Blockchain transaction failed:', blockchainError)
        console.error('Error details:', {
          message: blockchainError.message,
          code: blockchainError.code,
          response: blockchainError.response?.data,
          stack: blockchainError.stack,
        })
        
        // Extract error message from response
        const errorDetail = blockchainError.response?.data?.detail || blockchainError.message || 'Unknown error'
        
        if (blockchainError.message?.includes('rejected') || blockchainError.code === 4001) {
          toast.error('Transaction rejected by user. Job created in database only.', { id: 'blockchain-tx', duration: 5000 })
        } else if (blockchainError.message?.includes('signer') || blockchainError.message?.includes('MetaMask')) {
          toast.error(`MetaMask error: ${blockchainError.message}. Please reconnect your wallet.`, { id: 'blockchain-tx', duration: 8000 })
        } else if (blockchainError.response?.status === 503) {
          // Service unavailable - contract not deployed
          toast.error(
            <div>
              <div className="font-bold">Blockchain not configured</div>
              <div className="text-sm mt-1">{errorDetail}</div>
              <div className="text-xs mt-2 text-gray-400">Job created in database only. Deploy contract to enable blockchain features.</div>
            </div>,
            { id: 'blockchain-tx', duration: 10000 }
          )
        } else {
          toast.error(
            <div>
              <div className="font-bold">Blockchain error</div>
              <div className="text-sm mt-1">{errorDetail}</div>
              <div className="text-xs mt-2 text-gray-400">Job created in database only.</div>
            </div>,
            { id: 'blockchain-tx', duration: 8000 }
          )
        }
      }
      
      // Navigate to jobs page
      navigate('/jobs')
    } catch (error: any) {
      console.error('Error posting job:', error)
      
      // Handle network errors
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || !error.response) {
        toast.error('Cannot connect to backend server. Please make sure the backend is running on http://localhost:8000', {
          duration: 5000,
        })
        return
      }
      
      // Handle validation errors
      if (error.response?.status === 422) {
        const errors = error.response.data?.detail || []
        if (Array.isArray(errors)) {
          const errorMessages = errors.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ')
          toast.error(`Validation error: ${errorMessages}`)
        } else {
          toast.error(`Validation error: ${error.response.data?.detail || 'Invalid data'}`)
        }
        return
      }
      
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to post job'
      toast.error(`Failed to post job: ${errorMessage}`, {
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    })
  }

  const categories = [
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

  return (
    <div className="w-full">
      {/* Header Section */}
      <section className="w-full py-16 bg-white border-b-2 border-[#1D1616]">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#1D1616] text-white text-sm font-bold mb-6 border-2 border-[#1D1616]">
            <SparklesIcon className="h-4 w-4 mr-2.5 text-[#D84040]" />
            Create New Job
          </div>
          <h1 className="text-6xl sm:text-7xl font-display font-bold text-[#1D1616] mb-4">Post a New Job</h1>
          <p className="text-2xl text-[#1D1616] max-w-3xl">Create a job listing and find the perfect freelancer for your project</p>
        </div>
      </section>

      {/* Wallet Connection Warning */}
      {!isConnected && (
        <section className="w-full py-8 bg-[#EEEEEE] border-b-2 border-[#1D1616]">
          <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="max-w-5xl mx-auto bg-white rounded-3xl p-8 border-2 border-[#D84040] shadow-elevated">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-8 w-8 text-[#D84040] mr-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-2xl font-display font-bold text-[#1D1616] mb-3">MetaMask Wallet Required</h3>
                  <p className="text-lg text-[#1D1616] mb-6 leading-relaxed">
                    You must connect your MetaMask wallet to post a job. Your wallet address will be used to create and manage the job listing.
                  </p>
                  <button
                    onClick={connect}
                    className="px-8 py-4 rounded-2xl text-lg font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all shadow-elevated hover:scale-105 border-2 border-[#D84040]"
                  >
                    Connect MetaMask Wallet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Form Section - Full Width */}
      {isConnected && (
        <section className="w-full py-16">
          <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="max-w-5xl mx-auto">
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-elevated p-12 md:p-16 border-2 border-[#1D1616]">
                <div className="space-y-10">
                  {/* Wallet Address Display */}
                  <div className="bg-[#EEEEEE] rounded-2xl p-6 border-2 border-[#1D1616]">
                    <p className="text-sm font-bold text-[#1D1616] mb-2">Posting as:</p>
                    <p className="text-lg font-mono font-bold text-[#D84040]">{address}</p>
                  </div>

                  <div>
                    <label htmlFor="title" className="block text-base font-bold text-[#1D1616] mb-4">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      className="block w-full px-6 py-4 border-2 border-[#1D1616] rounded-2xl bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] focus:border-transparent text-[#1D1616] font-semibold text-lg"
                      placeholder="e.g., React Developer Needed"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-base font-bold text-[#1D1616] mb-4">
                      Description * (Markdown supported)
                    </label>
                    <MarkdownEditor
                      value={formData.description}
                      onChange={(value) => setFormData({ ...formData, description: value })}
                      placeholder="Describe the job requirements, deliverables, and expectations...&#10;&#10;You can use Markdown formatting:&#10;- **Bold text**&#10;- *Italic text*&#10;- Lists&#10;- Links&#10;- Code blocks"
                      rows={12}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label htmlFor="budget" className="block text-base font-bold text-[#1D1616] mb-4">
                        Budget (MATIC) *
                      </label>
                      <input
                        type="number"
                        name="budget"
                        id="budget"
                        required
                        step="0.001"
                        min="0.001"
                        value={formData.budget}
                        onChange={handleChange}
                        className="block w-full px-6 py-4 border-2 border-[#1D1616] rounded-2xl bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] focus:border-transparent text-[#1D1616] font-semibold text-lg"
                        placeholder="0.1"
                      />
                    </div>

                    <div>
                      <label htmlFor="deadline" className="block text-base font-bold text-[#1D1616] mb-4">
                        Deadline *
                      </label>
                      <input
                        type="date"
                        name="deadline"
                        id="deadline"
                        required
                        value={formData.deadline}
                        onChange={handleChange}
                        className="block w-full px-6 py-4 border-2 border-[#1D1616] rounded-2xl bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] focus:border-transparent text-[#1D1616] font-semibold text-lg"
                      />
                    </div>
                  </div>

                  <CustomDropdown
                    options={categories}
                    value={formData.category}
                    onChange={(value) => setFormData({ ...formData, category: value })}
                    placeholder="Select a category"
                    label="Category"
                    required
                  />

                  {/* Tags Input */}
                  <div>
                    <label htmlFor="tags" className="block text-base font-bold text-[#1D1616] mb-4">
                      Tags (Optional)
                    </label>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        id="tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addTag()
                          }
                        }}
                        className="flex-1 px-6 py-4 border-2 border-[#1D1616] rounded-2xl bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] focus:border-transparent text-[#1D1616] font-semibold text-lg"
                        placeholder="Add a tag and press Enter"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-6 py-4 rounded-2xl text-lg font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all border-2 border-[#D84040]"
                      >
                        Add
                      </button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-[#EEEEEE] text-[#1D1616] border-2 border-[#1D1616]"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-2 hover:scale-110 transition-transform"
                            >
                              <span className="text-[#D84040]">×</span>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Escrow Address (Optional) */}
                  <div>
                    <label htmlFor="escrow_address" className="block text-base font-bold text-[#1D1616] mb-4">
                      Escrow Address (Optional)
                    </label>
                    <input
                      type="text"
                      id="escrow_address"
                      value={formData.escrow_address}
                      onChange={(e) => setFormData({ ...formData, escrow_address: e.target.value })}
                      placeholder="0x..."
                      className="block w-full px-6 py-4 border-2 border-[#1D1616] rounded-2xl bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] focus:border-transparent text-[#1D1616] font-semibold text-lg"
                    />
                    <p className="mt-2 text-sm text-[#1D1616] opacity-75">
                      If provided, this address will have escrow privileges to release or revert payments
                    </p>
                  </div>

                  {/* Allow Escrow Revert */}
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      id="allow_escrow_revert"
                      checked={formData.allow_escrow_revert}
                      onChange={(e) => setFormData({ ...formData, allow_escrow_revert: e.target.checked })}
                      className="w-5 h-5 border-2 border-[#1D1616] rounded text-[#D84040] focus:ring-2 focus:ring-[#D84040]"
                    />
                    <label htmlFor="allow_escrow_revert" className="text-base font-bold text-[#1D1616] cursor-pointer">
                      Allow escrow to revert payment if no work is done
                    </label>
                  </div>

                  <div className="bg-[#EEEEEE] border-2 border-[#1D1616] rounded-2xl p-6">
                    <div className="flex items-start">
                      <InformationCircleIcon className="h-6 w-6 text-[#D84040] mr-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-base text-[#1D1616] font-bold mb-2">Blockchain Escrow</p>
                        <p className="text-sm text-[#1D1616] leading-relaxed">
                          Your payment will be held in a smart contract escrow. Funds will be released automatically when the work is approved.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t-2 border-[#1D1616]">
                    <button
                      type="button"
                      onClick={() => navigate('/jobs')}
                      className="px-10 py-4 border-2 border-[#1D1616] rounded-2xl text-base font-bold text-[#1D1616] bg-white hover:bg-[#EEEEEE] transition-all hover:scale-105 shadow-soft"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-10 py-4 border border-transparent rounded-2xl text-base font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all shadow-elevated hover:scale-105 inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PlusCircleIcon className="h-6 w-6 mr-3" />
                      {loading ? 'Posting...' : 'Post Job'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
