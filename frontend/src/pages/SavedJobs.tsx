import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  BookmarkIcon, 
  BookmarkSlashIcon,
  SparklesIcon,
  ArrowRightIcon,
  TagIcon,
  UserGroupIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline'
import { useWallet } from '../contexts/WalletContext'
import { config } from '../config'
import axios from 'axios'
import toast from 'react-hot-toast'

interface Job {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  budget: number
  deadline: string
  status: string
  proposal_count: number
  client_address: string
  created_at: string
}

export default function SavedJobs() {
  const { address, isConnected } = useWallet()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isConnected && address) {
      fetchSavedJobs()
    } else {
      setLoading(false)
    }
  }, [isConnected, address])

  const fetchSavedJobs = async () => {
    if (!isConnected || !address) return
    
    try {
      setLoading(true)
      const response = await axios.get(
        `${config.apiUrl}/api/v1/jobs/saved/${address}`
      )
      setJobs(response.data)
      setSavedJobIds(new Set(response.data.map((j: Job) => j.id)))
    } catch (error: any) {
      console.error('Error fetching saved jobs:', error)
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || !error.response) {
        toast.error('Cannot connect to backend server. Please make sure the backend is running.')
      } else {
        toast.error('Failed to load saved jobs')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUnsave = async (jobId: string) => {
    if (!isConnected || !address) return
    
    try {
      await axios.delete(
        `${config.apiUrl}/api/v1/jobs/${jobId}/save`,
        {
          params: { user_address: address },
        }
      )
      
      setJobs(jobs.filter(j => j.id !== jobId))
      setSavedJobIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })
      
      toast.success('Job removed from saved')
    } catch (error: any) {
      console.error('Error unsaving job:', error)
      toast.error('Failed to unsave job')
    }
  }

  if (!isConnected) {
    return (
      <div className="w-full flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto px-6">
          <BookmarkIcon className="h-16 w-16 text-[#1D1616] mx-auto mb-6" />
          <h2 className="text-3xl font-display font-bold text-[#1D1616] mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-lg text-[#1D1616]">
            Please connect your MetaMask wallet to view your saved jobs.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <section className="w-full py-16 bg-white border-b-2 border-[#1D1616]">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#1D1616] text-white text-sm font-bold mb-6 border-2 border-[#1D1616]">
            <SparklesIcon className="h-4 w-4 mr-2.5 text-[#D84040]" />
            Saved Jobs
          </div>
          <h1 className="text-6xl sm:text-7xl font-display font-bold text-[#1D1616] mb-4">
            My Saved Jobs
          </h1>
          <p className="text-2xl text-[#1D1616] max-w-3xl">
            Jobs you've bookmarked for later
          </p>
        </div>
      </section>

      {/* Jobs List */}
      <section className="w-full py-12 bg-white">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1D1616] border-t-transparent"></div>
              <p className="mt-4 text-[#1D1616]">Loading saved jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20 bg-[#EEEEEE] rounded-3xl border-2 border-[#1D1616] shadow-xl">
              <BookmarkIcon className="h-16 w-16 text-[#1D1616] mx-auto mb-6 opacity-50" />
              <h2 className="text-2xl font-display font-bold text-[#1D1616] mb-4">
                No Saved Jobs Yet
              </h2>
              <p className="text-lg text-[#1D1616] mb-8">
                Start browsing jobs and save the ones you're interested in for easy access later.
              </p>
              <Link
                to="/jobs"
                className="inline-flex items-center px-8 py-4 rounded-2xl text-base font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all shadow-lg hover:scale-105 border-2 border-[#D84040]"
              >
                <BriefcaseIcon className="h-5 w-5 mr-2" />
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-3xl p-8 border-2 border-[#1D1616] shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] relative"
                >
                  {/* Unsave Button */}
                  <button
                    onClick={() => handleUnsave(job.id)}
                    className="absolute top-6 right-6 p-2 rounded-xl bg-[#EEEEEE] text-[#D84040] hover:bg-[#D84040] hover:text-white transition-all border-2 border-[#1D1616]"
                    title="Remove from saved"
                  >
                    <BookmarkSlashIcon className="h-5 w-5" />
                  </button>

                  <div className="flex items-start justify-between mb-4 pr-12">
                    <div className="flex-1">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="text-2xl font-display font-bold text-[#1D1616] hover:text-[#D84040] transition-colors mb-2 block"
                      >
                        {job.title}
                      </Link>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#EEEEEE] text-[#1D1616] border border-[#1D1616]">
                          {job.category}
                        </span>
                        <span className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-100 text-blue-800 border-2 border-blue-300">
                          {job.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-base text-[#1D1616] mb-6 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Tags */}
                  {job.tags && job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {job.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-[#EEEEEE] text-[#1D1616] border border-[#1D1616]"
                        >
                          <TagIcon className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {job.tags.length > 3 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-[#EEEEEE] text-[#1D1616] border border-[#1D1616]">
                          +{job.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Job Details */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-[#1D1616]">
                      <CurrencyDollarIcon className="h-5 w-5 text-[#D84040]" />
                      <span className="font-bold">{job.budget} MATIC</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#1D1616]">
                      <UserGroupIcon className="h-5 w-5 text-[#D84040]" />
                      <span className="font-bold">{job.proposal_count || 0} proposal{job.proposal_count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#1D1616]">
                      <CalendarIcon className="h-5 w-5 text-[#D84040]" />
                      <span className="font-bold">
                        {new Date(job.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#1D1616]">
                      <BookmarkIcon className="h-5 w-5 text-[#D84040]" />
                      <span className="font-bold">
                        Saved {new Date(job.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    to={`/jobs/${job.id}`}
                    className="inline-flex items-center justify-center w-full px-6 py-3 rounded-2xl text-base font-bold text-white bg-[#1D1616] hover:bg-[#2A1F1F] transition-all shadow-lg hover:scale-105 border-2 border-[#1D1616]"
                  >
                    View Details
                    <ArrowRightIcon className="h-5 w-5 ml-2" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

