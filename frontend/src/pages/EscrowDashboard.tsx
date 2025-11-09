import { useState, useEffect } from 'react'
import { 
  CurrencyDollarIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { useWallet } from '../contexts/WalletContext'
import { config } from '../config'
import axios from 'axios'
import toast from 'react-hot-toast'
import { executeBlockchainTransaction } from '../utils/blockchain'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface EscrowJob {
  id: string
  title: string
  description: string
  budget: number
  client_address: string
  freelancer_address?: string
  status: string
  client_confirmed_completion: boolean
  freelancer_confirmed_completion: boolean
  allow_escrow_revert: boolean
  blockchain_job_id?: number
  created_at: string
  payment_released_at?: string
  funds_released?: boolean
}

export default function EscrowDashboard() {
  const { address, isConnected, signer } = useWallet()
  const [jobs, setJobs] = useState<EscrowJob[]>([])
  const [loading, setLoading] = useState(true)
  const [processingJobId, setProcessingJobId] = useState<string | null>(null)
  const [revertingJobId, setRevertingJobId] = useState<string | null>(null)
  const [checkingJobId, setCheckingJobId] = useState<string | null>(null)

  useEffect(() => {
    if (isConnected && address) {
      fetchEscrowJobs()
    }
  }, [isConnected, address])

  const fetchEscrowJobs = async () => {
    if (!address) return
    
    try {
      setLoading(true)
      const response = await axios.get(
        `${config.apiUrl}/api/v1/jobs/escrow/pending`,
        {
          params: { escrow_address: address }
        }
      )
      setJobs(response.data)
    } catch (error: any) {
      console.error('Error fetching escrow jobs:', error)
      toast.error('Failed to load escrow jobs')
    } finally {
      setLoading(false)
    }
  }

  const releasePayment = async (job: EscrowJob) => {
    if (!isConnected || !address || !signer || !job.blockchain_job_id) {
      toast.error('Please connect your wallet')
      return
    }

    if (!job.client_confirmed_completion || !job.freelancer_confirmed_completion) {
      toast.error('Both parties must confirm completion before payment can be released')
      return
    }

    setProcessingJobId(job.id)

    try {
      // Get the payment transaction from backend
      const response = await axios.post(
        `${config.apiUrl}/api/v1/jobs/${job.id}/escrow/release`,
        {},
        {
          params: { escrow_address: address }
        }
      )

      if (response.data.blockchain_transaction) {
        const transaction = response.data.blockchain_transaction.transaction
        
        // Execute the transaction
        await executeBlockchainTransaction(
          signer,
          transaction,
          'Releasing payment to freelancer...'
        )

        toast.success('Payment released successfully!')
        fetchEscrowJobs()
      } else if (response.data.needs_submit) {
        toast.error('Job must be submitted on blockchain first')
      } else if (response.data.funds_already_released) {
        toast.success('Payment already released')
        fetchEscrowJobs()
      } else if (response.data.blockchain_error) {
        toast.error(`Error: ${response.data.blockchain_error}`)
      }
    } catch (error: any) {
      console.error('Error releasing payment:', error)
      toast.error(error.response?.data?.detail || 'Failed to release payment')
    } finally {
      setProcessingJobId(null)
    }
  }

  const revertPayment = async (job: EscrowJob) => {
    if (!isConnected || !address || !signer || !job.blockchain_job_id) {
      toast.error('Please connect your wallet')
      return
    }

    if (!job.allow_escrow_revert) {
      toast.error('This job does not allow escrow revert')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to revert payment for "${job.title}"? This will refund the client.`
    )

    if (!confirmed) return

    setRevertingJobId(job.id)

    try {
      // Get the revert transaction from backend
      const response = await axios.post(
        `${config.apiUrl}/api/v1/jobs/${job.id}/escrow/revert`,
        {},
        {
          params: { escrow_address: address }
        }
      )

      if (response.data.blockchain_transaction) {
        const transaction = response.data.blockchain_transaction.transaction
        
        // Execute the transaction
        await executeBlockchainTransaction(
          signer,
          transaction,
          'Reverting payment to client...'
        )

        toast.success('Payment reverted successfully!')
        fetchEscrowJobs()
      } else if (response.data.blockchain_error) {
        toast.error(`Error: ${response.data.blockchain_error}`)
      }
    } catch (error: any) {
      console.error('Error reverting payment:', error)
      toast.error(error.response?.data?.detail || 'Failed to revert payment')
    } finally {
      setRevertingJobId(null)
    }
  }

  const checkJobStatus = async (job: EscrowJob) => {
    if (!job.blockchain_job_id) {
      toast.error('Job does not have a blockchain job ID')
      return
    }

    setCheckingJobId(job.id)

    try {
      // Fetch latest blockchain status (read-only, no wallet needed)
      const response = await axios.get(
        `${config.apiUrl}/api/v1/jobs/blockchain/${job.blockchain_job_id}`
      )

      const blockchainJob = response.data
      const fundsReleased = blockchainJob.funds_released || false
      const completedAt = blockchainJob.completed_at

      if (fundsReleased && completedAt) {
        const releaseDate = new Date(completedAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
        toast.success(`✓ Payment was released on ${releaseDate}`, { duration: 5000 })
        
        // Update the job in local state immediately
        setJobs(prevJobs => 
          prevJobs.map(j => 
            j.id === job.id 
              ? { ...j, funds_released: true, payment_released_at: completedAt }
              : j
          )
        )
      } else if (blockchainJob.status === 'completed' && !fundsReleased) {
        toast('Job is completed on blockchain but funds not yet released', { 
          icon: 'ℹ️',
          duration: 4000 
        })
      } else {
        toast(`Job status on blockchain: ${blockchainJob.status.replace('_', ' ').toUpperCase()}`, { 
          icon: 'ℹ️',
          duration: 3000 
        })
      }

      // Refresh the jobs list to update UI
      setTimeout(() => {
        fetchEscrowJobs()
      }, 1000)
    } catch (error: any) {
      console.error('Error checking job status:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to check job status'
      toast.error(errorMsg, { duration: 5000 })
    } finally {
      setCheckingJobId(null)
    }
  }

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-[#EEEEEE] flex items-center justify-center p-4">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-[#D84040] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1D1616] mb-2">Wallet Not Connected</h2>
          <p className="text-[#1D1616]">Please connect your MetaMask wallet to access the escrow dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#EEEEEE] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#1D1616] mb-4">Escrow Dashboard</h1>
          <p className="text-lg text-[#1D1616] opacity-75">
            Manage payments for jobs where you are the escrow
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1D1616] border-t-transparent"></div>
            <p className="mt-4 text-[#1D1616]">Loading escrow jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-[#EEEEEE] rounded-3xl border-2 border-[#1D1616] shadow-xl">
            <CurrencyDollarIcon className="h-16 w-16 text-[#1D1616] mx-auto mb-6 opacity-50" />
            <h2 className="text-2xl font-display font-bold text-[#1D1616] mb-4">
              No Pending Escrow Jobs
            </h2>
            <p className="text-[#1D1616] opacity-75">
              You don't have any jobs assigned as escrow yet
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {jobs.map((job) => {
              const bothConfirmed = job.client_confirmed_completion && job.freelancer_confirmed_completion
              const canRelease = bothConfirmed && job.blockchain_job_id && !job.funds_released
              const canRevert = job.allow_escrow_revert && job.status !== 'completed' && job.status !== 'refunded'

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-3xl border-2 border-[#1D1616] shadow-xl p-6 sm:p-8 hover:shadow-2xl transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-[#1D1616] mb-4">{job.title}</h3>
                      
                      <div className="prose prose-sm max-w-none text-[#1D1616] mb-6">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {job.description}
                        </ReactMarkdown>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-2">
                          <CurrencyDollarIcon className="h-5 w-5 text-[#D84040]" />
                          <span className="text-[#1D1616] font-semibold">
                            Budget: {job.budget} MATIC
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-5 w-5 text-[#1D1616]" />
                          <span className="text-[#1D1616] font-semibold">
                            Status: {job.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex items-center gap-2">
                          {job.client_confirmed_completion ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircleIcon className="h-5 w-5 text-red-600" />
                          )}
                          <span className={`font-semibold ${job.client_confirmed_completion ? 'text-green-600' : 'text-red-600'}`}>
                            Client: {job.client_confirmed_completion ? 'Confirmed' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {job.freelancer_confirmed_completion ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircleIcon className="h-5 w-5 text-red-600" />
                          )}
                          <span className={`font-semibold ${job.freelancer_confirmed_completion ? 'text-green-600' : 'text-red-600'}`}>
                            Freelancer: {job.freelancer_confirmed_completion ? 'Confirmed' : 'Pending'}
                          </span>
                        </div>
                      </div>

                      {bothConfirmed && !job.funds_released && (
                        <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 mb-6">
                          <p className="text-sm font-bold text-green-800">
                            ✓ Both parties confirmed! Payment can be released.
                          </p>
                        </div>
                      )}

                      {job.funds_released && job.payment_released_at && (
                        <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 mb-6">
                          <p className="text-sm font-bold text-blue-800">
                            ✓ Payment released on {new Date(job.payment_released_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 lg:min-w-[200px]">
                      {job.blockchain_job_id && (
                        <button
                          onClick={() => checkJobStatus(job)}
                          disabled={checkingJobId === job.id}
                          className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all font-bold text-sm shadow-lg hover:scale-105 border-2 border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {checkingJobId === job.id ? (
                            <>
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Checking...
                            </>
                          ) : (
                            <>
                              <MagnifyingGlassIcon className="h-5 w-5" />
                              Check Status
                            </>
                          )}
                        </button>
                      )}

                      {canRelease && (
                        <button
                          onClick={() => releasePayment(job)}
                          disabled={processingJobId === job.id || !signer}
                          className="w-full bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all font-bold text-sm shadow-lg hover:scale-105 border-2 border-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {processingJobId === job.id ? (
                            <>
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CurrencyDollarIcon className="h-5 w-5" />
                              Release Payment
                            </>
                          )}
                        </button>
                      )}

                      {canRevert && (
                        <button
                          onClick={() => revertPayment(job)}
                          disabled={revertingJobId === job.id || !signer}
                          className="w-full bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all font-bold text-sm shadow-lg hover:scale-105 border-2 border-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {revertingJobId === job.id ? (
                            <>
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <ArrowPathIcon className="h-5 w-5" />
                              Revert Payment
                            </>
                          )}
                        </button>
                      )}

                      {!canRelease && !canRevert && !job.blockchain_job_id && (
                        <div className="text-center text-sm text-[#1D1616] opacity-75 py-4">
                          {!bothConfirmed && 'Waiting for both parties to confirm...'}
                          {bothConfirmed && !job.blockchain_job_id && 'No blockchain job ID'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

