import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  BriefcaseIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  SparklesIcon,
  ArrowRightIcon,
  TagIcon,
  UserGroupIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
  freelancer_address?: string
  created_at: string
  updated_at: string
}

type StatusFilter = 'all' | 'open' | 'in_progress' | 'completed' | 'cancelled'

export default function MyJobs() {
  const { address, isConnected } = useWallet()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false
  })

  // Lock background scroll and hide footer when modal is open
  useEffect(() => {
    if (deleteModalOpen) {
      // Lock body scroll
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      
      // Hide footer by adding class to body
      document.body.classList.add('modal-open')
      
      // Also lock Lenis smooth scroll if available
      const lenisInstance = (window as any).__lenis
      if (lenisInstance && typeof lenisInstance.stop === 'function') {
        lenisInstance.stop()
      }
      
      // Also add class to stop Lenis scrolling
      document.documentElement.classList.add('lenis-stopped')
      document.body.classList.add('lenis-stopped')

      return () => {
        // Cleanup: restore scroll and show footer
        document.body.style.overflow = originalOverflow
        document.body.classList.remove('modal-open')
        if (lenisInstance && typeof lenisInstance.start === 'function') {
          lenisInstance.start()
        }
        document.documentElement.classList.remove('lenis-stopped')
        document.body.classList.remove('lenis-stopped')
      }
    }
  }, [deleteModalOpen])

  useEffect(() => {
    if (isConnected && address) {
      fetchJobs()
    } else {
      setLoading(false)
    }
  }, [isConnected, address, currentPage])

  const fetchJobs = async () => {
    if (!isConnected || !address) return
    
    try {
      setLoading(true)
      const response = await axios.get(
        `${config.apiUrl}/api/v1/jobs/client/${address}`,
        {
          params: {
            page: currentPage,
            limit: 10
          }
        }
      )
      
      // Handle both old format (array) and new format (object with pagination)
      if (Array.isArray(response.data)) {
        setJobs(response.data)
        setPagination({
          page: 1,
          limit: 10,
          total: response.data.length,
          total_pages: 1,
          has_next: false,
          has_prev: false
        })
      } else {
        setJobs(response.data.jobs || [])
        setPagination(response.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          total_pages: 1,
          has_next: false,
          has_prev: false
        })
      }
    } catch (error: any) {
      console.error('Error fetching jobs:', error)
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || !error.response) {
        toast.error('Cannot connect to backend server. Please make sure the backend is running.')
      } else {
        toast.error('Failed to load your jobs')
      }
    } finally {
      setLoading(false)
    }
  }

  const openDeleteModal = (jobId: string, jobTitle: string) => {
    setJobToDelete({ id: jobId, title: jobTitle })
    setDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setJobToDelete(null)
  }

  const handleDelete = async () => {
    if (!isConnected || !address || !jobToDelete) return
    
    setDeleting(true)
    
    try {
      await axios.delete(
        `${config.apiUrl}/api/v1/jobs/${jobToDelete.id}`,
        {
          params: { client_address: address },
        }
      )
      
      // Remove job from current list
      setJobs(jobs.filter(j => j.id !== jobToDelete.id))
      // Update pagination total
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }))
      toast.success('Job deleted successfully')
      closeDeleteModal()
      
      // If current page becomes empty and not on first page, go to previous page
      if (jobs.length === 1 && currentPage > 1) {
        setCurrentPage(prev => Math.max(1, prev - 1))
      }
    } catch (error: any) {
      console.error('Error deleting job:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete job'
      toast.error(`Failed to delete job: ${errorMessage}`)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'disputed':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-[#EEEEEE] text-[#1D1616] border-[#1D1616]'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <BriefcaseIcon className="h-5 w-5" />
      case 'in_progress':
        return <ClockIcon className="h-5 w-5" />
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5" />
      default:
        return <BriefcaseIcon className="h-5 w-5" />
    }
  }

  const filteredJobs = jobs.filter(job => {
    if (statusFilter === 'all') return true
    return job.status.toLowerCase() === statusFilter
  })

  // Stats are calculated from all jobs (not just current page)
  // For accurate stats, we'd need a separate endpoint, but for now use current page data
  // Note: These stats are approximate when using pagination
  const stats = {
    total: pagination.total || jobs.length,
    open: jobs.filter(j => j.status.toLowerCase() === 'open').length,
    in_progress: jobs.filter(j => j.status.toLowerCase() === 'in_progress').length,
    completed: jobs.filter(j => j.status.toLowerCase() === 'completed').length,
    totalProposals: jobs.reduce((sum, j) => sum + (j.proposal_count || 0), 0),
    totalBudget: jobs.reduce((sum, j) => sum + j.budget, 0),
  }

  if (!isConnected) {
    return (
      <div className="w-full flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto px-6">
          <BriefcaseIcon className="h-16 w-16 text-[#1D1616] mx-auto mb-6" />
          <h2 className="text-3xl font-display font-bold text-[#1D1616] mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-lg text-[#1D1616]">
            Please connect your MetaMask wallet to view your posted jobs.
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
            My Jobs
          </div>
          <h1 className="text-6xl sm:text-7xl font-display font-bold text-[#1D1616] mb-4">
            Jobs I Posted
          </h1>
          <p className="text-2xl text-[#1D1616] max-w-3xl">
            Track and manage all the jobs you've created
          </p>
        </div>
      </section>

      {/* Stats Section */}
      {!loading && jobs.length > 0 && (
        <section className="w-full py-12 bg-[#EEEEEE] border-b-2 border-[#1D1616]">
          <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-2xl p-6 border-2 border-[#1D1616] shadow-xl text-center">
                <div className="text-3xl font-display font-bold text-[#1D1616] mb-2">{stats.total}</div>
                <div className="text-sm font-bold text-[#8E1616]">Total Jobs</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border-2 border-[#1D1616] shadow-xl text-center">
                <div className="text-3xl font-display font-bold text-blue-600 mb-2">{stats.open}</div>
                <div className="text-sm font-bold text-[#8E1616]">Open</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border-2 border-[#1D1616] shadow-xl text-center">
                <div className="text-3xl font-display font-bold text-yellow-600 mb-2">{stats.in_progress}</div>
                <div className="text-sm font-bold text-[#8E1616]">In Progress</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border-2 border-[#1D1616] shadow-xl text-center">
                <div className="text-3xl font-display font-bold text-green-600 mb-2">{stats.completed}</div>
                <div className="text-sm font-bold text-[#8E1616]">Completed</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border-2 border-[#1D1616] shadow-xl text-center">
                <div className="text-3xl font-display font-bold text-[#D84040] mb-2">{stats.totalProposals}</div>
                <div className="text-sm font-bold text-[#8E1616]">Proposals</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border-2 border-[#1D1616] shadow-xl text-center">
                <div className="text-2xl font-display font-bold text-[#1D1616] mb-2">{stats.totalBudget.toFixed(2)}</div>
                <div className="text-sm font-bold text-[#8E1616]">Total Budget (MATIC)</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filter and Jobs List */}
      <section className="w-full py-12 bg-white">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          {/* Status Filter */}
          {jobs.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-3">
              {(['all', 'open', 'in_progress', 'completed', 'cancelled'] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all border-2 ${
                    statusFilter === status
                      ? 'bg-[#1D1616] text-white border-[#1D1616] shadow-lg'
                      : 'bg-white text-[#1D1616] border-[#1D1616] hover:bg-[#EEEEEE]'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1D1616] border-t-transparent"></div>
              <p className="mt-4 text-[#1D1616]">Loading your jobs...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-20 bg-[#EEEEEE] rounded-3xl border-2 border-[#1D1616] shadow-xl">
              <BriefcaseIcon className="h-16 w-16 text-[#1D1616] mx-auto mb-6 opacity-50" />
              <h2 className="text-2xl font-display font-bold text-[#1D1616] mb-4">
                {jobs.length === 0 ? 'No Jobs Posted Yet' : 'No Jobs Match This Filter'}
              </h2>
              <p className="text-lg text-[#1D1616] mb-8">
                {jobs.length === 0 
                  ? "You haven't posted any jobs yet. Create your first job listing to get started!"
                  : 'Try selecting a different status filter.'}
              </p>
              {jobs.length === 0 && (
                <Link
                  to="/post-job"
                  className="inline-flex items-center px-8 py-4 rounded-2xl text-base font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all shadow-lg hover:scale-105 border-2 border-[#D84040]"
                >
                  <BriefcaseIcon className="h-5 w-5 mr-2" />
                  Post Your First Job
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-3xl p-8 border-2 border-[#1D1616] shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-4">
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
                        <span className={`px-3 py-1 rounded-xl text-xs font-bold border-2 flex items-center gap-1 ${getStatusColor(job.status)}`}>
                          {getStatusIcon(job.status)}
                          {job.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-base text-[#1D1616] mb-6 line-clamp-3 leading-relaxed prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {job.description}
                    </ReactMarkdown>
                  </div>

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
                      <ClockIcon className="h-5 w-5 text-[#D84040]" />
                      <span className="font-bold">
                        Posted {new Date(job.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-2xl text-base font-bold text-white bg-[#1D1616] hover:bg-[#2A1F1F] transition-all shadow-lg hover:scale-105 border-2 border-[#1D1616]"
                    >
                      View Details
                      <ArrowRightIcon className="h-5 w-5 ml-2" />
                    </Link>
                    {job.status.toLowerCase() === 'open' && (
                      <button
                        onClick={() => openDeleteModal(job.id, job.title)}
                        className="px-6 py-3 rounded-2xl text-base font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all shadow-lg hover:scale-105 border-2 border-[#D84040] flex items-center justify-center"
                        title="Delete job"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredJobs.length > 0 && pagination.total_pages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-[#1D1616] font-bold">
                Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} jobs
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!pagination.has_prev || loading}
                  className={`px-4 py-2 rounded-2xl text-sm font-bold border-2 transition-all flex items-center gap-2 ${
                    pagination.has_prev
                      ? 'bg-white text-[#1D1616] border-[#1D1616] hover:bg-[#EEEEEE] hover:scale-105'
                      : 'bg-[#EEEEEE] text-gray-400 border-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    let pageNum: number
                    if (pagination.total_pages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= pagination.total_pages - 2) {
                      pageNum = pagination.total_pages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 rounded-2xl text-sm font-bold border-2 transition-all ${
                          currentPage === pageNum
                            ? 'bg-[#1D1616] text-white border-[#1D1616]'
                            : 'bg-white text-[#1D1616] border-[#1D1616] hover:bg-[#EEEEEE] hover:scale-105'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))}
                  disabled={!pagination.has_next || loading}
                  className={`px-4 py-2 rounded-2xl text-sm font-bold border-2 transition-all flex items-center gap-2 ${
                    pagination.has_next
                      ? 'bg-white text-[#1D1616] border-[#1D1616] hover:bg-[#EEEEEE] hover:scale-105'
                      : 'bg-[#EEEEEE] text-gray-400 border-gray-300 cursor-not-allowed'
                  }`}
                >
                  Next
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#1D1616] w-full max-w-md">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b-2 border-[#1D1616] p-6 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-2xl font-display font-bold text-[#1D1616]">Delete Job</h2>
              </div>
              <button
                onClick={closeDeleteModal}
                className="p-2 rounded-xl text-[#1D1616] hover:bg-[#EEEEEE] transition-all"
                aria-label="Close"
                disabled={deleting}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-base text-[#1D1616]">
                Are you sure you want to delete <span className="font-bold">"{jobToDelete.title}"</span>?
              </p>
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                <p className="text-sm text-red-800 font-bold">
                  ⚠️ This action cannot be undone. The job and all associated data will be permanently deleted.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex gap-3 p-6 pt-4 border-t-2 border-[#1D1616] bg-white rounded-b-3xl">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="flex-1 px-6 py-3 rounded-2xl text-base font-bold text-[#1D1616] bg-[#EEEEEE] hover:bg-[#E5E5E5] transition-all border-2 border-[#1D1616] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-6 py-3 rounded-2xl text-base font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all border-2 border-[#D84040] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-5 w-5" />
                    Delete Job
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

