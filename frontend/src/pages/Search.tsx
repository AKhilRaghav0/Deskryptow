import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  XMarkIcon,
  SparklesIcon,
  ArrowRightIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'
import { config } from '../config'
import SaveJobButton from '../components/SaveJobButton'
import toast from 'react-hot-toast'

interface Job {
  id: string
  title: string
  description: string
  budget: number
  category: string
  tags: string[]
  deadline: string
  status: string
  proposal_count: number
}

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  useEffect(() => {
    fetchAvailableTags()
    // Initial search with empty query to show all jobs
    performSearch('', [], '')
  }, [])

  // Real-time search with debouncing (200ms delay for faster response)
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout for debounced search - reduced to 200ms for faster response
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery, selectedTags, selectedCategory)
    }, 200)

    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, selectedTags, selectedCategory])

  const fetchAvailableTags = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/v1/search/tags`)
      setAvailableTags(response.data.tags || [])
    } catch (error) {
      console.error('Error fetching tags:', error)
      // Continue without tags if this fails
    }
  }

  const performSearch = async (query: string, tags: string[], category: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.append('q', query.trim())
      if (category) params.append('category', category)
      if (tags.length > 0) {
        tags.forEach(tag => params.append('tags', tag))
      }
      params.append('status', 'open') // Only show open jobs
      params.append('limit', '100')

      const response = await axios.get(
        `${config.apiUrl}/api/v1/search/jobs?${params.toString()}`
      )
      setJobs(response.data.jobs || [])
    } catch (error: any) {
      console.error('Search error:', error)
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || !error.response) {
        toast.error('Cannot connect to backend server. Please make sure the backend is running.')
      } else {
        toast.error('Search failed. Please try again.')
      }
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
      // Trigger search immediately when tag is toggled
      performSearch(searchQuery, newTags, selectedCategory)
      return newTags
    })
  }

  const removeTag = (tag: string) => {
    setSelectedTags(prev => {
      const newTags = prev.filter(t => t !== tag)
      // Trigger search immediately when tag is removed
      performSearch(searchQuery, newTags, selectedCategory)
      return newTags
    })
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <section className="w-full py-16 bg-white border-b-2 border-[#1D1616]">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#1D1616] text-white text-sm font-bold mb-6 border-2 border-[#1D1616]">
            <SparklesIcon className="h-4 w-4 mr-2.5 text-[#D84040]" />
            Search Jobs
          </div>
          <h1 className="text-6xl sm:text-7xl font-display font-bold text-[#1D1616] mb-4">Find Your Perfect Job</h1>
          <p className="text-2xl text-[#1D1616] max-w-3xl">
            Search through thousands of opportunities using keywords, tags, and filters
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="w-full py-12 bg-[#EEEEEE] border-b-2 border-[#1D1616]">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-6xl mx-auto">
            {/* Main Search Bar */}
            <div className="bg-white rounded-3xl p-8 shadow-elevated border-2 border-[#1D1616] mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  {loading ? (
                    <div className="h-6 w-6 border-2 border-[#D84040] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MagnifyingGlassIcon className="h-6 w-6 text-[#1D1616]" />
                  )}
                </div>
                <input
                  type="text"
                  className="block w-full pl-14 pr-12 py-4 border-2 border-[#1D1616] rounded-2xl bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] focus:border-transparent text-[#1D1616] font-semibold text-lg transition-all"
                  placeholder="Search jobs by title, description, tags, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-[#1D1616] hover:text-[#D84040] transition-colors"
                    title="Clear search"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="mt-4 text-sm text-[#1D1616] font-medium">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-[#D84040] border-t-transparent rounded-full animate-spin" />
                      Searching...
                    </span>
                  ) : (
                    <span>Searching for: <span className="font-bold text-[#D84040]">"{searchQuery}"</span></span>
                  )}
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Category Filter */}
              <div className="bg-white rounded-3xl p-6 shadow-card border-2 border-[#1D1616]">
                <div className="flex items-center mb-4">
                  <FunnelIcon className="h-5 w-5 mr-2 text-[#1D1616]" />
                  <label className="text-base font-bold text-[#1D1616]">Category</label>
                </div>
                <select
                  className="block w-full px-4 py-3 border-2 border-[#1D1616] rounded-2xl bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] text-[#1D1616] font-semibold"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags Filter */}
              <div className="bg-white rounded-3xl p-6 shadow-card border-2 border-[#1D1616]">
                <div className="flex items-center mb-4">
                  <SparklesIcon className="h-5 w-5 mr-2 text-[#1D1616]" />
                  <label className="text-base font-bold text-[#1D1616]">Tags</label>
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {availableTags.slice(0, 10).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                        selectedTags.includes(tag)
                          ? 'bg-[#D84040] text-white border-2 border-[#D84040]'
                          : 'bg-[#EEEEEE] text-[#1D1616] border-2 border-[#1D1616] hover:bg-[#1D1616] hover:text-white'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-card border-2 border-[#1D1616] mb-6">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-bold text-[#1D1616] mr-2">Selected:</span>
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold bg-[#D84040] text-white border-2 border-[#D84040]"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:scale-110 transition-transform"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => setSelectedTags([])}
                    className="ml-auto text-sm font-bold text-[#D84040] hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="w-full py-16">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-6xl mx-auto">
            {/* Results Count */}
            <div className="mb-8 flex items-center justify-between">
              <p className="text-lg text-[#1D1616] font-semibold">
                {loading ? 'Searching...' : `Found ${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'}`}
              </p>
            </div>

            {/* Jobs Grid */}
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1D1616] border-t-transparent"></div>
                <p className="mt-4 text-[#1D1616] font-semibold">Searching...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-3xl p-20 text-center shadow-card border-2 border-[#1D1616]">
                <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-[#EEEEEE] flex items-center justify-center border-2 border-[#1D1616]">
                  <MagnifyingGlassIcon className="h-12 w-12 text-[#1D1616]" />
                </div>
                <p className="text-[#1D1616] text-xl font-bold mb-3">No jobs found</p>
                <p className="text-[#1D1616]">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="relative bg-white rounded-3xl shadow-card hover:shadow-elevated transition-all p-8 border-2 border-[#1D1616] group hover:scale-105 hover:border-[#D84040]"
                  >
                    {/* Save Button */}
                    <div className="absolute top-6 right-6 z-20">
                      <SaveJobButton jobId={job.id} />
                    </div>

                    <Link to={`/jobs/${job.id}`} className="block">
                      <h3 className="text-2xl font-display font-bold text-[#1D1616] group-hover:text-[#D84040] transition-colors mb-3 line-clamp-2 pr-12">
                        {job.title}
                      </h3>
                      <p className="text-[#1D1616] line-clamp-3 mb-4 leading-relaxed text-base">{job.description}</p>
                      
                      {/* Tags */}
                      {job.tags && job.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-[#EEEEEE] text-[#1D1616] border border-[#1D1616]"
                            >
                              <TagIcon className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                          {job.tags.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-[#EEEEEE] text-[#1D1616] border border-[#1D1616]">
                              +{job.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-4 border-t-2 border-[#1D1616]">
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-[#EEEEEE] text-[#1D1616] border-2 border-[#1D1616]">
                            {job.category}
                          </span>
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-[#EEEEEE] text-[#8E1616] border-2 border-[#8E1616]">
                            {job.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-display font-bold text-[#D84040]">{job.budget} MATIC</p>
                          <p className="text-xs text-[#1D1616] mt-1 font-semibold">
                            {job.proposal_count || 0} proposal{job.proposal_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-[#D84040] font-semibold text-sm group-hover:translate-x-2 transition-transform">
                        View Details
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

