import { useState, useEffect } from 'react'
import { BookmarkIcon, BookmarkSlashIcon } from '@heroicons/react/24/outline'
import { useWallet } from '../contexts/WalletContext'
import { config } from '../config'
import axios from 'axios'
import toast from 'react-hot-toast'

interface SaveJobButtonProps {
  jobId: string
  className?: string
}

export default function SaveJobButton({ jobId, className = '' }: SaveJobButtonProps) {
  const { address, isConnected } = useWallet()
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isConnected && address && jobId) {
      checkIfSaved()
    }
  }, [isConnected, address, jobId])

  const checkIfSaved = async () => {
    if (!isConnected || !address || !jobId) return
    
    try {
      const response = await axios.get(
        `${config.apiUrl}/api/v1/jobs/saved/${address}`
      )
      const savedJobIds = response.data.map((j: any) => j.id)
      setIsSaved(savedJobIds.includes(jobId))
    } catch (error: any) {
      // Silently fail - don't spam errors
      console.error('Error checking saved status:', error)
      // If it's a 404 or network error, assume not saved
      if (error.response?.status === 404 || !error.response) {
        setIsSaved(false)
      }
    }
  }

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isConnected || !address) {
      toast.error('Please connect your wallet to save jobs', {
        duration: 3000,
        icon: '🔒',
      })
      return
    }

    if (!jobId) {
      toast.error('Invalid job ID', {
        duration: 3000,
      })
      return
    }

    setLoading(true)
    try {
      if (isSaved) {
        // Unsave
        const response = await axios.delete(
          `${config.apiUrl}/api/v1/jobs/${jobId}/save`,
          {
            params: { user_address: address },
          }
        )
        setIsSaved(false)
        toast.success('Job removed from saved', {
          duration: 2000,
          icon: '📑',
        })
      } else {
        // Save
        const response = await axios.post(
          `${config.apiUrl}/api/v1/jobs/${jobId}/save`,
          null, // Empty body
          {
            params: { user_address: address },
          }
        )
        setIsSaved(true)
        toast.success('Job saved successfully!', {
          duration: 2000,
          icon: '✅',
        })
        // Refresh saved status to ensure consistency
        setTimeout(() => {
          checkIfSaved()
        }, 500)
      }
    } catch (error: any) {
      console.error('Error toggling save:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to save job'
      
      // Handle specific error cases
      if (errorMessage.includes('already saved') || error.response?.status === 400) {
        setIsSaved(true)
        toast.success('Job is already saved', {
          duration: 2000,
          icon: '✅',
        })
      } else if (error.response?.status === 404) {
        if (errorMessage.includes('Job not found')) {
          toast.error('Job not found. It may have been deleted.', {
            duration: 3000,
            icon: '❌',
          })
        } else if (isSaved) {
          // Job was already unsaved, update state
          setIsSaved(false)
          toast.success('Job removed from saved', {
            duration: 2000,
            icon: '📑',
          })
        } else {
          toast.error('Job not found', {
            duration: 3000,
            icon: '❌',
          })
        }
      } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || !error.response) {
        toast.error('Cannot connect to server. Please check your connection.', {
          duration: 4000,
          icon: '⚠️',
        })
      } else {
        toast.error(`Failed to save job: ${errorMessage}`, {
          duration: 3000,
          icon: '❌',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return null
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`p-2 rounded-xl transition-all border-2 z-20 relative ${
        isSaved
          ? 'bg-[#D84040] text-white border-[#D84040] hover:bg-[#8E1616]'
          : 'bg-white text-[#1D1616] border-[#1D1616] hover:bg-[#EEEEEE]'
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={isSaved ? 'Remove from saved' : 'Save job'}
      type="button"
    >
      {loading ? (
        <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isSaved ? (
        <BookmarkSlashIcon className="h-5 w-5" />
      ) : (
        <BookmarkIcon className="h-5 w-5" />
      )}
    </button>
  )
}

