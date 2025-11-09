import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, ClockIcon, CurrencyDollarIcon, CheckCircleIcon, UserIcon, SparklesIcon, TagIcon, ChatBubbleLeftRightIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import SaveJobButton from '../components/SaveJobButton'
import AddTeamMember from '../components/AddTeamMember'
import SubmitProposalModal from '../components/SubmitProposalModal'
import SubmitWorkModal from '../components/SubmitWorkModal'
import { config } from '../config'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useWallet } from '../contexts/WalletContext'
import { executeBlockchainTransaction } from '../utils/blockchain'

interface Job {
  id: string
  title: string
  description: string
  budget: number
  category: string
  deadline: string
  status: string
  client_address: string
  freelancer_address?: string
  skills_required: string[]
  tags: string[]
  proposal_count: number
  client_confirmed_completion?: boolean
  freelancer_confirmed_completion?: boolean
  blockchain_job_id?: number
  created_at: string
  updated_at: string
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isConnected, address, signer } = useWallet()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false)
  const [confirmingCompletion, setConfirmingCompletion] = useState(false)
  const [releasingPayment, setReleasingPayment] = useState(false)
  const [paymentTransaction, setPaymentTransaction] = useState<any>(null)
  const [autoPaymentTimer, setAutoPaymentTimer] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [autoPaymentActive, setAutoPaymentActive] = useState(false)
  const [isSubmitWorkModalOpen, setIsSubmitWorkModalOpen] = useState(false)
  const [submittingWork, setSubmittingWork] = useState(false)

  useEffect(() => {
    if (id) {
      fetchJob()
    }
  }, [id])

  // Listen for proposal acceptance events to refresh job (background check only)
  useEffect(() => {
    const checkJobUpdate = async () => {
      if (!id) return
      
      try {
        const response = await axios.get(`${config.apiUrl}/api/v1/jobs/${id}`)
        let updatedJob = response.data
        
        // If job needs repair (has proposals but no freelancer, or wrong status), repair it
        const needsRepair = (!updatedJob.freelancer_address && updatedJob.proposal_count > 0) || 
                           (updatedJob.freelancer_address && updatedJob.status === 'open')
        
        if (needsRepair) {
          try {
            const repairResponse = await axios.post(`${config.apiUrl}/api/v1/jobs/${id}/repair-freelancer`)
            if (repairResponse.data) {
              updatedJob = repairResponse.data
              console.log('✅ Background repair succeeded:', { freelancer: updatedJob.freelancer_address, status: updatedJob.status })
            }
          } catch (e) {
            console.log('Background repair failed:', e)
          }
        }
        
        // Always update - React will handle re-renders efficiently
        setJob((currentJob) => {
          if (!currentJob) {
            return updatedJob
          }
          
          // Compare key fields to see if update is needed
          const freelancerChanged = updatedJob.freelancer_address !== currentJob.freelancer_address
          const statusChanged = updatedJob.status !== currentJob.status
          const completionChanged = 
            updatedJob.client_confirmed_completion !== currentJob.client_confirmed_completion ||
            updatedJob.freelancer_confirmed_completion !== currentJob.freelancer_confirmed_completion
          
          // If any important field changed, update
          if (freelancerChanged || statusChanged || completionChanged) {
            console.log('Job updated:', { freelancerChanged, statusChanged, completionChanged })
            return updatedJob
          }
          
          // No changes, return current job (prevents unnecessary re-renders)
          return currentJob
        })
      } catch (error) {
        // Silently fail - don't show errors for background checks
        console.log('Background job check failed:', error)
      }
    }

    const handleProposalAccepted = () => {
      if (id) {
        // Silently check for updates in background
        checkJobUpdate()
      }
    }

    // Listen for custom event when proposal is accepted
    window.addEventListener('proposal-accepted', handleProposalAccepted)

    return () => {
      window.removeEventListener('proposal-accepted', handleProposalAccepted)
    }
  }, [id])

  const fetchJob = async (showLoading = true) => {
    if (!id) return
    
    try {
      if (showLoading) {
        setLoading(true)
      }
      setError(null)
      const response = await axios.get(`${config.apiUrl}/api/v1/jobs/${id}`)
      const jobData = response.data
      
      // Always check and repair if needed - especially for client view
      const isClient = isConnected && address && address.toLowerCase() === jobData.client_address.toLowerCase()
      const hasConfirmations = jobData.client_confirmed_completion || jobData.freelancer_confirmed_completion
      const needsRepair = (
        (jobData.freelancer_address && jobData.status === 'open') ||  // Has freelancer but wrong status
        (!jobData.freelancer_address && jobData.proposal_count > 0) ||  // No freelancer but has proposals
        (isClient && jobData.proposal_count > 0) ||  // Client viewing and has proposals (might need repair)
        (hasConfirmations && jobData.status === 'open') ||  // Has confirmations but status is still open
        (isClient && jobData.freelancer_address && jobData.status === 'open')  // Client viewing, has freelancer, but status is open
      )
      
      if (needsRepair) {
        try {
          console.log('🔧 Attempting auto-repair...', { 
            isClient, 
            hasFreelancer: !!jobData.freelancer_address, 
            status: jobData.status, 
            proposals: jobData.proposal_count,
            hasConfirmations 
          })
          const repairResponse = await axios.post(`${config.apiUrl}/api/v1/jobs/${id}/repair-freelancer`)
          if (repairResponse.data) {
            const repaired = repairResponse.data
            console.log('✅ Job auto-repaired:', { 
              freelancer: repaired.freelancer_address, 
              status: repaired.status,
              clientConfirmed: repaired.client_confirmed_completion,
              freelancerConfirmed: repaired.freelancer_confirmed_completion
            })
            setJob(repaired)
            return
          }
        } catch (repairError: any) {
          console.log('Repair attempt failed:', repairError.response?.data || repairError.message)
          // Continue to use original data if repair fails
        }
      }
      
      // Double-check: If client is viewing and status is wrong, force repair
      if (isClient && jobData.freelancer_address && jobData.status === 'open') {
        try {
          console.log('🔧 Force repair for client view...')
          const repairResponse = await axios.post(`${config.apiUrl}/api/v1/jobs/${id}/repair-freelancer`)
          if (repairResponse.data) {
            console.log('✅ Force repair succeeded:', repairResponse.data.status)
            setJob(repairResponse.data)
            return
          }
        } catch (e) {
          console.log('Force repair failed:', e)
        }
      }
      
      setJob(jobData)
      
      // Check if both confirmed and fetch payment transaction if needed
      if (response.data.client_confirmed_completion && 
          response.data.freelancer_confirmed_completion && 
          isConnected && address &&
          (response.data.status === 'in_progress' || response.data.status === 'submitted' || response.data.status === 'completed')) {
        // Try to get payment transaction (only if client)
        if (address.toLowerCase() === response.data.client_address.toLowerCase()) {
          // Only fetch if we don't have a transaction yet, or if job status changed
          if (!paymentTransaction || response.data.status === 'completed') {
            try {
              const checkResponse = await axios.post(
                `${config.apiUrl}/api/v1/jobs/${response.data.id}/confirm-completion/client`,
                {},
                {
                  params: { client_address: address },
                }
              )
              if (checkResponse.data.blockchain_transaction) {
                const transaction = checkResponse.data.blockchain_transaction.transaction
                setPaymentTransaction(transaction)
                // Timer will start via useEffect when paymentTransaction is set
              } else if (checkResponse.data.funds_already_released) {
                // Funds already released, clear payment transaction
                setPaymentTransaction(null)
              }
            } catch (e) {
              // Ignore errors - transaction might not be ready yet or already released
              console.log('Could not fetch payment transaction:', e)
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching job:', error)
      if (error.response?.status === 404) {
        setError('Job not found')
        toast.error('Job not found. It may have been deleted.')
      } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || !error.response) {
        setError('Cannot connect to server')
        toast.error('Cannot connect to backend server. Please make sure the backend is running.')
      } else {
        setError('Failed to load job')
        toast.error('Failed to load job details')
      }
    } finally {
      setLoading(false)
    }
  }

  const startChat = async () => {
    if (!isConnected || !address || !job) {
      toast.error('Please connect your wallet to start a chat')
      return
    }

    // Determine the other participant
    let otherParticipant: string
    if (address.toLowerCase() === job.client_address.toLowerCase()) {
      // User is client - chat with freelancer
      if (!job.freelancer_address) {
        toast.error('No freelancer assigned to this job yet')
        return
      }
      otherParticipant = job.freelancer_address
    } else if (job.freelancer_address && address.toLowerCase() === job.freelancer_address.toLowerCase()) {
      // User is freelancer - chat with client
      otherParticipant = job.client_address
    } else {
      // User is neither client nor freelancer - chat with job poster (client)
      otherParticipant = job.client_address
    }

    if (address.toLowerCase() === otherParticipant.toLowerCase()) {
      toast.error('You cannot chat with yourself')
      return
    }

    try {
      // Create or get conversation
      const response = await axios.post(
        `${config.apiUrl}/api/v1/chat/conversations`,
        {},
        {
          params: {
            participant1_address: address,
            participant2_address: otherParticipant,
            job_id: job.id,
          },
        }
      )
      
      navigate(`/chat/${response.data.conversation_id}`)
    } catch (error: any) {
      console.error('Error starting chat:', error)
      toast.error('Failed to start chat')
    }
  }

  const confirmCompletion = async (role: 'client' | 'freelancer') => {
    if (!isConnected || !address || !job || !signer) {
      toast.error('Please connect your wallet')
      return
    }

    // Validate job status - only allow confirmation for in_progress or submitted jobs
    if (job.status !== 'in_progress' && job.status !== 'submitted') {
      toast.error(`Cannot confirm completion for job with status: ${job.status}. Job must be in progress or submitted.`)
      return
    }

    // Ensure freelancer is assigned
    if (!job.freelancer_address) {
      toast.error('Cannot confirm completion: No freelancer assigned to this job yet.')
      return
    }

    setConfirmingCompletion(true)

    try {
      const endpoint = role === 'client' 
        ? `${config.apiUrl}/api/v1/jobs/${job.id}/confirm-completion/client`
        : `${config.apiUrl}/api/v1/jobs/${job.id}/confirm-completion/freelancer`
      
      const response = await axios.post(
        endpoint,
        {},
        {
          params: {
            [role === 'client' ? 'client_address' : 'freelancer_address']: address,
          },
        }
      )

      if (response.data.both_confirmed) {
        if (response.data.needs_submit) {
          // Backend returned submit transaction - freelancer needs to sign it
          if (response.data.submit_transaction && response.data.submit_transaction.transaction) {
            if (role === 'freelancer' && signer) {
              // Auto-submit for freelancer
              toast.loading('Submitting work on blockchain...', { id: 'submit-tx', duration: 30000 })
              try {
                await executeBlockchainTransaction(
                  signer,
                  response.data.submit_transaction.transaction,
                  (status: string) => {
                    toast.loading(status, { id: 'submit-tx' })
                  }
                )
                toast.success('Work submitted! Payment can now be released.', { id: 'submit-tx' })
                // Refresh to get updated status
                setTimeout(() => fetchJob(), 2000)
              } catch (error: any) {
                console.error('Error submitting work:', error)
                toast.error(error.message || 'Failed to submit work on blockchain', { id: 'submit-tx', duration: 10000 })
              }
            } else {
              // Client or no signer - show message
              toast('Both parties confirmed! Freelancer needs to submit work on blockchain first.', { 
                id: 'completion-tx', 
                duration: 10000,
                icon: 'ℹ️'
              })
            }
          } else {
            // No transaction provided
            toast.error('Job must be submitted on blockchain before payment can be released. Please submit work first.', { id: 'completion-tx', duration: 10000 })
          }
        } else if (response.data.funds_already_released) {
          // Funds already released
          toast.success('Payment already released for this job.', { id: 'completion-tx' })
        } else if (response.data.blockchain_transaction) {
          // Both confirmed - store transaction for payment button
          setPaymentTransaction(response.data.blockchain_transaction.transaction)
          toast.success('Both parties confirmed! Payment will auto-proceed in 30 seconds.', { id: 'completion-tx', duration: 8000 })
          
          // Start auto-payment timer (30 seconds)
          if (role === 'client') {
            startAutoPaymentTimer(30)
          }
        } else if (response.data.blockchain_error) {
          // Blockchain error occurred
          toast.error(`Blockchain error: ${response.data.blockchain_error}`, { id: 'completion-tx', duration: 10000 })
        } else {
          toast.success(response.data.message || 'Completion confirmed! Waiting for other party.')
        }
      } else {
        toast.success(response.data.message || 'Completion confirmed! Waiting for other party.')
      }

      // Refresh job data
      fetchJob()
    } catch (error: any) {
      console.error('Error confirming completion:', error)
      toast.error(error.response?.data?.detail || 'Failed to confirm completion')
    } finally {
      setConfirmingCompletion(false)
    }
  }

  const startAutoPaymentTimer = (seconds: number) => {
    // Clear any existing timer
    if (autoPaymentTimer) {
      clearInterval(autoPaymentTimer)
    }

    setTimeRemaining(seconds)
    setAutoPaymentActive(true)

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setAutoPaymentActive(false)
          // Auto-proceed to payment
          if (paymentTransaction) {
            proceedToPayment()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setAutoPaymentTimer(timer as any)
  }

  const stopAutoPayment = () => {
    if (autoPaymentTimer) {
      clearInterval(autoPaymentTimer)
      setAutoPaymentTimer(null)
    }
    setAutoPaymentActive(false)
    setTimeRemaining(0)
    toast.success('Auto-payment cancelled')
  }

  const submitWork = async (deliverableDescription: string, deliverableFiles: File[]) => {
    if (!isConnected || !address || !job || !signer || !job.blockchain_job_id) {
      toast.error('Please connect your wallet and ensure job is on blockchain')
      return
    }

    if (address.toLowerCase() !== job.freelancer_address?.toLowerCase()) {
      toast.error('Only the assigned freelancer can submit work')
      return
    }

    setSubmittingWork(true)
    try {
      // Step 0: Check if job needs to be accepted on blockchain first
      // If the blockchain job doesn't have a freelancer yet, accept it first
      try {
        const blockchainJobResponse = await axios.get(
          `${config.apiUrl}/api/v1/jobs/blockchain/${job.blockchain_job_id}`
        )
        const blockchainJob = blockchainJobResponse.data
        
        // Check if freelancer is not set on blockchain (job is still "open")
        // Also check if the freelancer address doesn't match the current user
        const zeroAddress = '0x0000000000000000000000000000000000000000'
        const blockchainFreelancer = blockchainJob.freelancer?.toLowerCase() || zeroAddress
        const currentUserAddress = address.toLowerCase()
        
        if (blockchainFreelancer === zeroAddress || 
            blockchainJob.status === 'open' || 
            blockchainFreelancer !== currentUserAddress) {
          toast.loading('Job needs to be accepted on blockchain first...', { id: 'accept-job-tx' })
          
          // Build acceptJob transaction
          const acceptJobResponse = await axios.post(
            `${config.apiUrl}/api/v1/jobs/${job.id}/blockchain/accept`,
            {},
            {
              params: {
                blockchain_job_id: job.blockchain_job_id,
                freelancer_address: address,
              },
            }
          )
          
          const acceptTransaction = acceptJobResponse.data.transaction
          
          // Execute acceptJob transaction
          try {
            await executeBlockchainTransaction(
              signer,
              acceptTransaction,
              (status: string) => {
                toast.loading(status, { id: 'accept-job-tx' })
              }
            )
            toast.success('Job accepted on blockchain!', { id: 'accept-job-tx' })
            
            // Wait a moment for blockchain to update
            await new Promise(resolve => setTimeout(resolve, 2000))
          } catch (acceptError: any) {
            console.error('Error accepting job on blockchain:', acceptError)
            if (acceptError.message?.includes('rejected')) {
              toast.error('Transaction rejected. Please try again.', { id: 'accept-job-tx' })
              setSubmittingWork(false)
              return
            } else {
              throw acceptError
            }
          }
        }
      } catch (blockchainCheckError: any) {
        // If we can't check blockchain status, proceed anyway (might be network issue)
        console.warn('Could not check blockchain job status:', blockchainCheckError)
      }

      // Step 1: Upload deliverables to IPFS
      let deliverableHash = 'QmPlaceholderDeliverable'
      
      if (deliverableFiles.length > 0 || deliverableDescription.trim()) {
        const deliverableData: any = {
          description: deliverableDescription.trim(),
          submitted_at: new Date().toISOString(),
          job_id: job.id,
          job_title: job.title,
        }

        // If files are provided, we'll need to upload them
        // For now, we'll create a JSON with description and file info
        if (deliverableFiles.length > 0) {
          deliverableData.files = deliverableFiles.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type,
          }))
        }

        // Upload to IPFS via backend
        const formData = new FormData()
        formData.append('description', deliverableDescription.trim())
        deliverableFiles.forEach((file) => {
          formData.append('files', file)
        })

        const ipfsResponse = await axios.post(
          `${config.apiUrl}/api/v1/jobs/${job.id}/upload-deliverable`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )
        
        if (ipfsResponse.data.ipfs_hash) {
          deliverableHash = ipfsResponse.data.ipfs_hash
        }
      }

      // Step 2: Build blockchain transaction
      const blockchainResponse = await axios.post(
        `${config.apiUrl}/api/v1/jobs/${job.id}/blockchain/submit`,
        {
          blockchain_job_id: job.blockchain_job_id,
          deliverable_hash: deliverableHash,
        },
        {
          params: { freelancer_address: address },
        }
      )

      const transaction = blockchainResponse.data.transaction

      // Step 3: Execute transaction (with progress updates)
      toast.loading('Submitting work on blockchain...', { id: 'submit-work-tx' })
      try {
        await executeBlockchainTransaction(
          signer,
          transaction,
          (status: string) => {
            toast.loading(status, { id: 'submit-work-tx' })
          }
        )
        toast.success('Work submitted successfully! Job status updated to Submitted.', { id: 'submit-work-tx' })
        
        // Refresh job data after a short delay
        setTimeout(() => {
          fetchJob()
        }, 2000)
        setIsSubmitWorkModalOpen(false)
      } catch (error: any) {
        console.error('Error executing transaction:', error)
        if (error.message?.includes('rejected')) {
          toast.error('Transaction rejected. Please try again.', { id: 'submit-work-tx' })
        } else {
          toast.error('Transaction submitted but confirmation pending. Job will update shortly.', { id: 'submit-work-tx', duration: 8000 })
          // Still refresh to check status
          setTimeout(() => {
            fetchJob()
          }, 3000)
        }
      }
    } catch (error: any) {
      console.error('Error submitting work:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to submit work'
      if (errorMsg.includes('Not the freelancer')) {
        toast.error('Job must be accepted on blockchain first. Please wait a moment and try again.', { duration: 8000 })
      } else {
        toast.error(errorMsg)
      }
    } finally {
      setSubmittingWork(false)
    }
  }

  useEffect(() => {
    // Cleanup timer on unmount
    return () => {
      if (autoPaymentTimer) {
        clearInterval(autoPaymentTimer)
      }
    }
  }, [autoPaymentTimer])

  useEffect(() => {
    // Check if both confirmed and start timer if needed
    if (job?.client_confirmed_completion && 
        job?.freelancer_confirmed_completion && 
        paymentTransaction &&
        address?.toLowerCase() === job.client_address.toLowerCase() &&
        !autoPaymentActive &&
        !releasingPayment &&
        timeRemaining === 0) {
      startAutoPaymentTimer(30)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.client_confirmed_completion, job?.freelancer_confirmed_completion, paymentTransaction, address, job?.client_address])

  const proceedToPayment = async () => {
    if (!isConnected || !address || !job || !signer || !paymentTransaction) {
      toast.error('Please connect your wallet')
      return
    }

    // Only client can release payment
    if (address.toLowerCase() !== job.client_address.toLowerCase()) {
      toast.error('Only the job client can release payment')
      return
    }

    // Stop auto-payment timer if active
    if (autoPaymentActive) {
      stopAutoPayment()
    }

    setReleasingPayment(true)

    try {
      toast.loading('Signing transaction to release payment...', { id: 'payment-tx' })
      
      console.log('📝 Transaction to sign:', paymentTransaction)
      
      const result = await executeBlockchainTransaction(
        signer,
        paymentTransaction,
        (status) => {
          toast.loading(status, { id: 'payment-tx' })
        }
      )

      console.log('✅ Transaction successful:', result.txHash)

      // Submit transaction to backend
      await axios.post(
        `${config.apiUrl}/api/v1/jobs/blockchain/submit-tx`,
        null,
        {
          params: {
            signed_tx_hex: result.txHash,
            job_id: job.id,
          },
        }
      )

      toast.success('Payment released! Job marked as completed.', { id: 'payment-tx' })
      toast.success(
        <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer" className="underline">
          View on PolygonScan
        </a>,
        { duration: 5000 }
      )

      // Clear payment transaction and refresh job
      setPaymentTransaction(null)
      fetchJob()
    } catch (txError: any) {
      console.error('❌ Transaction error:', txError)
      toast.error(txError.message || 'Failed to release payment. Check console for details.', { id: 'payment-tx', duration: 10000 })
    } finally {
      setReleasingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1D1616] border-t-transparent mb-4"></div>
          <p className="text-[#1D1616] font-semibold">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="w-full flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-24 h-24 rounded-3xl bg-[#EEEEEE] flex items-center justify-center mx-auto mb-6 border-2 border-[#1D1616]">
            <SparklesIcon className="h-12 w-12 text-[#1D1616]" />
          </div>
          <h2 className="text-3xl font-display font-bold text-[#1D1616] mb-4">Job Not Found</h2>
          <p className="text-lg text-[#1D1616] mb-6">
            {error || 'The job you are looking for does not exist or has been removed.'}
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center px-8 py-4 rounded-2xl text-base font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all shadow-lg hover:scale-105 border-2 border-[#D84040]"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <section className="w-full py-12 bg-white border-b-2 border-[#1D1616]">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
            <Link
            to="/jobs"
            className="inline-flex items-center text-base text-[#1D1616] hover:text-[#D84040] mb-8 transition-colors font-semibold group"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Jobs
          </Link>
        </div>
      </section>

      {/* Main Content - Full Width */}
      <section className="w-full py-16">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-8">
              {/* Header Card */}
              <div className="bg-white rounded-3xl shadow-elevated p-10 border-2 border-[#1D1616]">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex-1">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#1D1616] text-white text-sm font-bold mb-6 border-2 border-[#1D1616]">
                      <SparklesIcon className="h-4 w-4 mr-2 text-[#D84040]" />
                      Job Details
                    </div>
                    <div className="flex items-start justify-between mb-6">
                      <h1 className="text-5xl sm:text-6xl font-display font-bold text-[#1D1616]">{job.title}</h1>
                      <SaveJobButton jobId={id || ''} />
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mb-8">
                      <div className="flex items-center text-[#1D1616]">
                        <UserIcon className="h-6 w-6 mr-2 text-[#D84040]" />
                        <span className="font-mono text-base font-semibold">
                          {job.client_address.slice(0, 6)}...{job.client_address.slice(-4)}
                        </span>
                      </div>
                      <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-[#EEEEEE] text-[#1D1616] border-2 border-[#1D1616]">
                        {job.category}
                      </span>
                      <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-[#EEEEEE] text-[#8E1616] border-2 border-[#8E1616]">
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        {job.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {job.tags && job.tags.length > 0 && (
                        <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-[#EEEEEE] text-[#1D1616] border-2 border-[#1D1616]">
                          <TagIcon className="h-4 w-4 mr-2" />
                          {job.tags.length} tag{job.tags.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-8 pt-8 border-t-2 border-[#1D1616]">
                  <div className="flex items-center text-base text-[#1D1616]">
                    <ClockIcon className="h-6 w-6 mr-3 text-[#D84040]" />
                    <span className="font-bold">
                      Deadline: {new Date(job.deadline).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center text-base text-[#1D1616]">
                    <CurrencyDollarIcon className="h-6 w-6 mr-3 text-[#D84040]" />
                    <span className="font-bold">Budget: {job.budget} MATIC</span>
                  </div>
                  <div className="flex items-center text-base text-[#1D1616]">
                    <UserIcon className="h-6 w-6 mr-3 text-[#D84040]" />
                    <span className="font-bold">{job.proposal_count || 0} proposal{job.proposal_count !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {/* Description Card */}
              <div className="bg-white rounded-3xl shadow-card p-10 border-2 border-[#1D1616]">
                <h2 className="text-3xl font-display font-bold text-[#1D1616] mb-8">Description</h2>
                <div className="prose prose-lg max-w-none text-[#1D1616]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-3xl font-bold text-[#1D1616] mb-4 mt-6">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-2xl font-bold text-[#1D1616] mb-3 mt-5">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xl font-bold text-[#1D1616] mb-2 mt-4">{children}</h3>,
                      p: ({ children }) => <p className="text-[#1D1616] mb-4 leading-relaxed text-lg">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-4 text-[#1D1616] space-y-2 ml-4">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-4 text-[#1D1616] space-y-2 ml-4">{children}</ol>,
                      li: ({ children }) => <li className="text-[#1D1616] leading-relaxed">{children}</li>,
                      code: ({ children, className }) => {
                        const isInline = !className
                        return isInline ? (
                          <code className="px-2 py-1 bg-[#EEEEEE] rounded text-[#D84040] font-mono text-sm border border-[#1D1616]">
                            {children}
                          </code>
                        ) : (
                          <code className="block p-4 bg-[#EEEEEE] rounded-xl text-[#1D1616] font-mono text-sm border-2 border-[#1D1616] overflow-x-auto mb-4">
                            {children}
                          </code>
                        )
                      },
                      a: ({ children, href }) => (
                        <a href={href} className="text-[#D84040] hover:text-[#8E1616] underline font-semibold" target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      ),
                      strong: ({ children }) => <strong className="font-bold text-[#1D1616]">{children}</strong>,
                      em: ({ children }) => <em className="italic text-[#1D1616]">{children}</em>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-[#D84040] pl-4 my-4 italic text-[#1D1616] bg-[#EEEEEE] py-2 rounded-r-xl">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {job.description}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Skills Required Card */}
              {job.skills_required && job.skills_required.length > 0 && (
                <div className="bg-white rounded-3xl shadow-card p-10 border-2 border-[#1D1616]">
                  <h2 className="text-3xl font-display font-bold text-[#1D1616] mb-8">Skills Required</h2>
                  <div className="flex flex-wrap gap-3">
                    {job.skills_required.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-[#EEEEEE] text-[#1D1616] border-2 border-[#1D1616]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags Card */}
              {job.tags && job.tags.length > 0 && (
                <div className="bg-white rounded-3xl shadow-card p-10 border-2 border-[#1D1616]">
                  <h2 className="text-3xl font-display font-bold text-[#1D1616] mb-8">Tags</h2>
                  <div className="flex flex-wrap gap-3">
                    {job.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-[#EEEEEE] text-[#1D1616] border-2 border-[#1D1616]"
                      >
                        <TagIcon className="h-4 w-4 mr-2" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-28 space-y-6">
                {/* Budget Card */}
                <div className="bg-white rounded-3xl shadow-elevated p-8 border-2 border-[#1D1616]">
                  <div className="text-center">
                    <p className="text-base text-[#1D1616] mb-3 font-semibold">Budget</p>
                    <p className="text-5xl font-display font-bold text-[#D84040] mb-8">{job.budget} MATIC</p>
                    
                    {/* Submit Work Section - For Freelancers */}
                    {isConnected && address && 
                     job.freelancer_address && 
                     address.toLowerCase() === job.freelancer_address.toLowerCase() &&
                     job.status === 'in_progress' &&
                     job.blockchain_job_id && (
                      <div className="mb-6 p-6 bg-white rounded-2xl border-2 border-[#1D1616] shadow-card">
                        <p className="text-lg font-bold text-[#1D1616] mb-3 text-center">Submit Your Work</p>
                        <p className="text-sm text-[#1D1616] mb-4 text-center opacity-75">
                          Upload your completed work and deliverables
                        </p>
                        <button
                          onClick={() => setIsSubmitWorkModalOpen(true)}
                          disabled={submittingWork}
                          className="w-full bg-[#D84040] text-white px-4 py-3 rounded-xl hover:bg-[#8E1616] transition-all font-bold text-sm shadow-lg hover:scale-105 border-2 border-[#D84040] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <SparklesIcon className="h-5 w-5" />
                          {submittingWork ? 'Submitting...' : 'Submit Work'}
                        </button>
                      </div>
                    )}

                    {/* Completion Confirmation Section */}
                    {/* Only show for jobs that are in_progress or submitted (work has started) */}
                    {isConnected && address && 
                     (job.status === 'in_progress' || job.status === 'submitted') &&
                     job.freelancer_address &&
                     (address.toLowerCase() === job.client_address.toLowerCase() ||
                      address.toLowerCase() === job.freelancer_address.toLowerCase()) && (
                      <div className="mb-6 p-6 bg-white rounded-2xl border-2 border-[#1D1616] shadow-card">
                        <p className="text-lg font-bold text-[#1D1616] mb-4 text-center">Confirm Job Completion</p>
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#1D1616]">Client:</span>
                            <span className={`font-bold ${job.client_confirmed_completion ? 'text-green-600' : 'text-[#8E1616]'}`}>
                              {job.client_confirmed_completion ? '✓ Confirmed' : 'Pending'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#1D1616]">Freelancer:</span>
                            <span className={`font-bold ${job.freelancer_confirmed_completion ? 'text-green-600' : 'text-[#8E1616]'}`}>
                              {job.freelancer_confirmed_completion ? '✓ Confirmed' : job.freelancer_address ? 'Pending' : 'Not Assigned'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Client confirmation button - show if user is client and freelancer is assigned */}
                        {address.toLowerCase() === job.client_address.toLowerCase() && 
                         job.freelancer_address &&
                         !job.client_confirmed_completion && (
                          <button
                            onClick={() => confirmCompletion('client')}
                            disabled={confirmingCompletion}
                            className="w-full bg-[#D84040] text-white px-4 py-3 rounded-xl hover:bg-[#8E1616] transition-all font-bold text-sm shadow-lg hover:scale-105 border-2 border-[#D84040] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-2"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                            {confirmingCompletion ? 'Confirming...' : 'I Confirm Job is Complete'}
                          </button>
                        )}
                        
                        {/* Freelancer confirmation button - show if user is freelancer */}
                        {job.freelancer_address && 
                         address.toLowerCase() === job.freelancer_address.toLowerCase() && 
                         !job.freelancer_confirmed_completion && (
                          <button
                            onClick={() => confirmCompletion('freelancer')}
                            disabled={confirmingCompletion}
                            className="w-full bg-[#D84040] text-white px-4 py-3 rounded-xl hover:bg-[#8E1616] transition-all font-bold text-sm shadow-lg hover:scale-105 border-2 border-[#D84040] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                            {confirmingCompletion ? 'Confirming...' : 'I Confirm Job is Complete'}
                          </button>
                        )}
                        
                        {/* Show message if no freelancer assigned yet */}
                        {address.toLowerCase() === job.client_address.toLowerCase() && 
                         !job.freelancer_address && (
                          <p className="text-xs text-center text-[#1D1616] font-semibold py-2">
                            Waiting for freelancer to be assigned...
                          </p>
                        )}
                        
                        {/* Both confirmed - Show proceed to payment button */}
                        {job.client_confirmed_completion && job.freelancer_confirmed_completion && (
                          <div className="space-y-2">
                            <p className="text-xs text-center text-green-600 font-bold mb-2">
                              ✓ Both parties confirmed!
                            </p>
                            {address.toLowerCase() === job.client_address.toLowerCase() && (
                              <>
                                {paymentTransaction ? (
                                  <div className="space-y-2">
                                    {autoPaymentActive && timeRemaining > 0 && (
                                      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-2 mb-2">
                                        <p className="text-xs text-center text-yellow-800 font-bold">
                                          ⏱️ Auto-payment in {timeRemaining}s
                                        </p>
                                      </div>
                                    )}
                                    <div className="flex gap-2">
                                      <button
                                        onClick={proceedToPayment}
                                        disabled={releasingPayment || !paymentTransaction}
                                        className="flex-1 bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 transition-all font-bold text-sm shadow-lg hover:scale-105 border-2 border-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                      >
                                        {releasingPayment ? (
                                          <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Releasing Payment...
                                          </>
                                        ) : (
                                          <>
                                            <CurrencyDollarIcon className="h-5 w-5" />
                                            {autoPaymentActive && timeRemaining > 0 
                                              ? `Pay Now (${timeRemaining}s)` 
                                              : 'Proceed to Payment'}
                                          </>
                                        )}
                                      </button>
                                      {autoPaymentActive && timeRemaining > 0 && (
                                        <button
                                          onClick={stopAutoPayment}
                                          disabled={releasingPayment}
                                          className="px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold text-sm shadow-lg hover:scale-105 border-2 border-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                          title="Stop auto-payment"
                                        >
                                          <XCircleIcon className="h-5 w-5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <p className="text-xs text-center text-[#1D1616] font-semibold mb-2">
                                      Preparing payment transaction...
                                    </p>
                                    <button
                                      onClick={async () => {
                                        // Manually fetch the transaction
                                        if (!job || !address) return
                                        try {
                                          const checkResponse = await axios.post(
                                            `${config.apiUrl}/api/v1/jobs/${job.id}/confirm-completion/client`,
                                            {},
                                            {
                                              params: { client_address: address },
                                            }
                                          )
                                          if (checkResponse.data.blockchain_transaction) {
                                            const transaction = checkResponse.data.blockchain_transaction.transaction
                                            setPaymentTransaction(transaction)
                                            toast.success('Payment transaction ready!')
                                            startAutoPaymentTimer(30)
                                          } else if (checkResponse.data.needs_submit) {
                                            toast.error('Job must be submitted on blockchain first')
                                          } else if (checkResponse.data.funds_already_released) {
                                            toast.success('Payment already released')
                                            fetchJob()
                                          } else if (checkResponse.data.blockchain_error) {
                                            toast.error(`Error: ${checkResponse.data.blockchain_error}`)
                                          }
                                        } catch (e: any) {
                                          console.error('Error fetching transaction:', e)
                                          toast.error(e.response?.data?.detail || 'Failed to fetch payment transaction')
                                        }
                                      }}
                                      className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-all font-bold text-sm shadow-lg hover:scale-105 border-2 border-blue-600 flex items-center justify-center gap-2"
                                    >
                                      <CurrencyDollarIcon className="h-5 w-5" />
                                      Get Payment Transaction
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                            {address.toLowerCase() !== job.client_address.toLowerCase() && (
                              <p className="text-xs text-center text-[#1D1616] font-semibold">
                                Waiting for client to release payment...
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {isConnected && address ? (
                      <div className="space-y-3">
                        {address.toLowerCase() !== job.client_address.toLowerCase() && 
                         !job.freelancer_address && (
                          <button
                            onClick={() => {
                              setIsProposalModalOpen(true)
                            }}
                            className="w-full bg-[#D84040] text-white px-6 py-4 rounded-2xl hover:bg-[#8E1616] transition-all font-bold text-lg shadow-elevated hover:scale-105 border-2 border-[#D84040]"
                          >
                            Submit Proposal
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            // Refresh job data before starting chat to ensure we have latest freelancer info
                            await fetchJob(false)
                            startChat()
                          }}
                          disabled={address.toLowerCase() === job.client_address.toLowerCase() && !job.freelancer_address}
                          className="w-full bg-[#1D1616] text-white px-6 py-4 rounded-2xl hover:bg-[#2A1F1F] transition-all font-bold text-lg shadow-elevated hover:scale-105 border-2 border-[#1D1616] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChatBubbleLeftRightIcon className="h-5 w-5" />
                          {address.toLowerCase() === job.client_address.toLowerCase() 
                            ? (job.freelancer_address ? 'Chat with Freelancer' : 'Chat Unavailable (No Freelancer)')
                            : (job.freelancer_address && address.toLowerCase() === job.freelancer_address.toLowerCase())
                            ? 'Chat with Client'
                            : 'Chat with Job Poster'}
                        </button>
                        {/* Manual refresh button - show if no freelancer but proposals exist */}
                        {!job.freelancer_address && job.proposal_count > 0 && (
                          <button
                            onClick={async () => {
                              await fetchJob(false)
                              toast.success('Job data refreshed')
                            }}
                            className="w-full bg-[#EEEEEE] text-[#1D1616] px-6 py-3 rounded-2xl hover:bg-[#E5E5E5] transition-all font-bold text-sm border-2 border-[#1D1616] flex items-center justify-center gap-2"
                            title="Refresh job data to check for accepted proposals"
                          >
                            <ArrowLeftIcon className="h-4 w-4 rotate-180" />
                            Refresh Job Status
                          </button>
                        )}
                      </div>
                    ) : (
                      <button 
                        onClick={() => toast.error('Please connect your wallet to submit a proposal')}
                        className="w-full bg-[#EEEEEE] text-[#1D1616] px-6 py-4 rounded-2xl hover:bg-[#E5E5E5] transition-all font-bold text-lg border-2 border-[#1D1616] cursor-not-allowed opacity-50"
                        disabled
                      >
                        Connect Wallet to Submit
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Info Card */}
                <div className="bg-[#EEEEEE] rounded-3xl p-8 border-2 border-[#1D1616]">
                  <h3 className="font-bold text-[#1D1616] mb-6 text-xl">Job Details</h3>
                  <div className="space-y-4 text-base">
                    <div className="flex justify-between items-center py-3 border-b-2 border-[#1D1616]">
                      <span className="text-[#1D1616] font-semibold">Status</span>
                      <span className="font-bold text-[#1D1616]">{job.status.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b-2 border-[#1D1616]">
                      <span className="text-[#1D1616] font-semibold">Category</span>
                      <span className="font-bold text-[#1D1616]">{job.category}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b-2 border-[#1D1616]">
                      <span className="text-[#1D1616] font-semibold">Proposals</span>
                      <span className="font-bold text-[#1D1616]">{job.proposal_count || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-[#1D1616] font-semibold">Deadline</span>
                      <span className="font-bold text-[#1D1616]">
                        {new Date(job.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Add Team Member */}
                <AddTeamMember 
                  jobId={job.id} 
                  clientAddress={job.client_address}
                  onMemberAdded={() => {
                    toast.success('Team member can now work on this job!')
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Submit Proposal Modal */}
      {job && (
        <SubmitProposalModal
          jobId={job.id}
          jobTitle={job.title}
          isOpen={isProposalModalOpen}
          onClose={() => setIsProposalModalOpen(false)}
          onSuccess={() => {
            // Refresh job data to update proposal count
            fetchJob()
          }}
        />
      )}

      {/* Submit Work Modal */}
      {job && (
        <SubmitWorkModal
          jobId={job.id}
          jobTitle={job.title}
          isOpen={isSubmitWorkModalOpen}
          onClose={() => setIsSubmitWorkModalOpen(false)}
          onSubmit={submitWork}
          isSubmitting={submittingWork}
        />
      )}
    </div>
  )
}
