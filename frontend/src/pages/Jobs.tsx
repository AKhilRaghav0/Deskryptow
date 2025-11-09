import { Link, useNavigate } from 'react-router-dom'
import { MagnifyingGlassIcon, FunnelIcon, SparklesIcon, ArrowRightIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import SaveJobButton from '../components/SaveJobButton'
import { config } from '../config'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useWallet } from '../contexts/WalletContext'

interface Job {
  id: string
  title: string
  description: string
  budget: number
  category: string
  deadline: string
  status: string
  tags: string[]
  proposal_count: number
  client_address: string
}

export default function Jobs() {
  const navigate = useNavigate()
  const { address, isConnected } = useWallet()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])

  const categories = ['all', 'Web Development', 'Mobile Development', 'UI/UX Design', 'Blockchain', 'AI/ML', 'Data Science', 'Content Writing', 'Marketing', 'Video Editing', 'Other']

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    // Client-side filtering for instant results
    let filtered = jobs

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((job) =>
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((job) => job.category === selectedCategory)
    }

    setFilteredJobs(filtered)
  }, [searchQuery, selectedCategory, jobs])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await axios.get(
        `${config.apiUrl}/api/v1/jobs/`,
        {
          params: {
            limit: 100,
            status: 'open', // Only show open jobs by default
          },
        }
      )
      setJobs(response.data)
      setFilteredJobs(response.data)
    } catch (error: any) {
      console.error('Error fetching jobs:', error)
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || !error.response) {
        toast.error('Cannot connect to backend server. Please make sure the backend is running.')
      } else {
        toast.error('Failed to load jobs')
      }
      setJobs([])
      setFilteredJobs([])
    } finally {
      setLoading(false)
    }
  }

  const startChat = async (job: Job, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isConnected || !address) {
      toast.error('Please connect your wallet to start a chat')
      return
    }

    if (address.toLowerCase() === job.client_address.toLowerCase()) {
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
            participant2_address: job.client_address,
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

  return (
    <div className="w-full">
      {/* Header - Full Width */}
      <section className="w-full py-16 bg-white border-b-2 border-[#1D1616]">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#1D1616] text-white text-sm font-bold mb-6 border-2 border-[#1D1616]">
            <SparklesIcon className="h-4 w-4 mr-2.5 text-[#D84040]" />
            Discover Opportunities
          </div>
          <h1 className="text-6xl sm:text-7xl font-display font-bold text-[#1D1616] mb-4">Browse Jobs</h1>
          <p className="text-2xl text-[#1D1616] max-w-3xl">
            Find your next freelance opportunity from thousands of available positions
          </p>
        </div>
      </section>

      {/* Search and Filter - Full Width */}
      <section className="w-full py-12 bg-[#EEEEEE] border-b-2 border-[#1D1616]">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="bg-white rounded-3xl p-8 shadow-elevated border-2 border-[#1D1616]">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-6 w-6 text-[#1D1616]" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-14 pr-5 py-4 border-2 border-[#1D1616] rounded-2xl bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] focus:border-transparent text-[#1D1616] font-semibold text-lg"
                    placeholder="Search jobs by title, description, or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="md:col-span-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <FunnelIcon className="h-6 w-6 text-[#1D1616]" />
                  </div>
                  <select
                    className="block w-full pl-14 pr-5 py-4 border-2 border-[#1D1616] rounded-2xl bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] focus:border-transparent text-[#1D1616] font-semibold text-lg appearance-none"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results - Full Width */}
      <section className="w-full py-16">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          {/* Results Count */}
          <div className="mb-8 flex items-center justify-between">
            <p className="text-lg text-[#1D1616] font-semibold">
              Showing <span className="font-bold text-[#1D1616] text-xl">{filteredJobs.length}</span> {filteredJobs.length === 1 ? 'job' : 'jobs'}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#1D1616] font-medium">Sort by:</span>
              <select className="px-4 py-2 border-2 border-[#1D1616] rounded-xl bg-white text-[#1D1616] font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#D84040]">
                <option>Newest</option>
                <option>Budget: High to Low</option>
                <option>Budget: Low to High</option>
                <option>Deadline</option>
              </select>
            </div>
          </div>

          {/* Jobs Grid - Full Width */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="md:col-span-2 lg:col-span-3 text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1D1616] border-t-transparent"></div>
                <p className="mt-4 text-[#1D1616] font-semibold">Loading jobs...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="md:col-span-2 lg:col-span-3 bg-white rounded-3xl p-20 text-center shadow-card border-2 border-[#1D1616]">
                <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-[#EEEEEE] flex items-center justify-center border-2 border-[#1D1616]">
                  <MagnifyingGlassIcon className="h-12 w-12 text-[#1D1616]" />
                </div>
                <p className="text-[#1D1616] text-xl font-bold mb-3">No jobs found</p>
                <p className="text-[#1D1616]">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="relative bg-white rounded-3xl shadow-card hover:shadow-elevated transition-all p-8 border-2 border-[#1D1616] group hover:scale-105 hover:border-[#D84040]"
                >
                  {/* Action Buttons */}
                  <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
                    {isConnected && address && address.toLowerCase() !== job.client_address.toLowerCase() && (
                      <button
                        onClick={(e) => startChat(job, e)}
                        className="p-2 rounded-xl bg-[#D84040] text-white hover:bg-[#8E1616] transition-all border-2 border-[#D84040]"
                        title="Chat with job poster"
                      >
                        <ChatBubbleLeftRightIcon className="h-5 w-5" />
                      </button>
                    )}
                    <SaveJobButton jobId={job.id} />
                  </div>
                  
                  <Link to={`/jobs/${job.id}`} className="block">
                    <div className="flex justify-between items-start mb-6 pr-12">
                      <div className="flex-1">
                        <h3 className="text-2xl font-display font-bold text-[#1D1616] group-hover:text-[#D84040] transition-colors mb-2 line-clamp-1">
                          {job.title}
                        </h3>
                        <p className="text-[#1D1616] line-clamp-3 mb-6 leading-relaxed text-base">{job.description}</p>
                      </div>
                    </div>
                  <div className="flex items-center justify-between pt-6 border-t-2 border-[#1D1616]">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-[#EEEEEE] text-[#1D1616] border-2 border-[#1D1616]">
                        {job.category}
                      </span>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-[#EEEEEE] text-[#8E1616] border-2 border-[#8E1616]">
                        {job.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {job.tags && job.tags.length > 0 && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-[#EEEEEE] text-[#1D1616] border-2 border-[#1D1616]">
                          {job.tags.length} tag{job.tags.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-3xl font-display font-bold text-[#D84040]">{job.budget} MATIC</p>
                      <p className="text-xs text-[#1D1616] mt-1 font-semibold">
                        Deadline: {new Date(job.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                    <div className="mt-6 flex items-center text-[#D84040] font-semibold text-sm group-hover:translate-x-2 transition-transform">
                      View Details
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </div>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
