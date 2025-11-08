import { Link } from 'react-router-dom'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

interface Job {
  id: number
  title: string
  description: string
  budget: string
  category: string
  deadline: string
  status: string
}

export default function Jobs() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Mock data - replace with actual API call
  const jobs: Job[] = [
    {
      id: 1,
      title: 'React Developer Needed',
      description: 'Looking for an experienced React developer to build a modern web application...',
      budget: '0.5 ETH',
      category: 'Web Development',
      deadline: '2024-02-15',
      status: 'Open',
    },
    {
      id: 2,
      title: 'UI/UX Designer for Mobile App',
      description: 'Need a talented designer to create beautiful mobile app interfaces...',
      budget: '0.3 ETH',
      category: 'UI/UX Design',
      deadline: '2024-02-20',
      status: 'Open',
    },
  ]

  const categories = ['all', 'Web Development', 'Mobile Development', 'UI/UX Design', 'Blockchain', 'AI/ML']

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Jobs</h1>
        <p className="mt-2 text-sm text-gray-600">
          Find your next freelance opportunity
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4 sm:flex sm:space-y-0 sm:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="sm:w-64">
          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No jobs found. Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{job.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {job.category}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {job.status}
                    </span>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-lg font-bold text-indigo-600">{job.budget}</p>
                  <p className="text-sm text-gray-500 mt-1">Deadline: {job.deadline}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

