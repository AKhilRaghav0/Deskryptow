import { useParams, Link } from 'react-router-dom'
import { ArrowLeftIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()

  // Mock data - replace with actual API call
  const job = {
    id: Number(id),
    title: 'React Developer Needed',
    description: 'Looking for an experienced React developer to build a modern web application with TypeScript and Tailwind CSS. The project involves creating a responsive dashboard with real-time data visualization.',
    budget: '0.5 ETH',
    category: 'Web Development',
    deadline: '2024-02-15',
    status: 'Open',
    client: '0x1234...5678',
    requirements: [
      '5+ years of React experience',
      'Strong TypeScript skills',
      'Experience with Tailwind CSS',
      'Understanding of Web3/blockchain concepts',
    ],
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <Link
        to="/jobs"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to Jobs
      </Link>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <p className="mt-1 text-sm text-gray-500">Posted by {job.client}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-indigo-600">{job.budget}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                {job.status}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center space-x-6 mb-6">
            <div className="flex items-center text-sm text-gray-500">
              <ClockIcon className="h-5 w-5 mr-2" />
              Deadline: {job.deadline}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <CurrencyDollarIcon className="h-5 w-5 mr-2" />
              Budget: {job.budget}
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {job.category}
            </span>
          </div>

          <div className="prose max-w-none">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{job.description}</p>

            <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Requirements</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {job.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex space-x-4">
            <button className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Submit Proposal
            </button>
            <button className="flex-1 bg-white text-indigo-600 border border-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Save Job
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

