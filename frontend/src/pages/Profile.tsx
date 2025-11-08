import { useParams } from 'react-router-dom'
import { UserCircleIcon, BriefcaseIcon, StarIcon } from '@heroicons/react/24/outline'

export default function Profile() {
  const { address } = useParams<{ address: string }>()

  // Mock data - replace with actual API call
  const profile = {
    address: address || '0x1234...5678',
    name: 'John Doe',
    title: 'Full Stack Developer',
    bio: 'Experienced developer with expertise in React, Node.js, and blockchain technologies.',
    rating: 4.8,
    totalJobs: 15,
    completedJobs: 12,
    skills: ['React', 'TypeScript', 'Node.js', 'Solidity', 'Web3'],
    portfolio: [
      {
        id: 1,
        title: 'E-commerce Platform',
        description: 'Built a full-stack e-commerce platform with React and Node.js',
      },
      {
        id: 2,
        title: 'DeFi Dashboard',
        description: 'Created a DeFi dashboard for tracking cryptocurrency portfolios',
      },
    ],
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <UserCircleIcon className="h-20 w-20 text-gray-400" />
              </div>
              <div className="ml-6 flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-lg text-gray-600 mt-1">{profile.title}</p>
                <p className="text-sm text-gray-500 mt-2 font-mono">{profile.address}</p>
                <div className="mt-4 flex items-center">
                  <StarIcon className="h-5 w-5 text-yellow-400" />
                  <span className="ml-2 text-lg font-semibold text-gray-900">{profile.rating}</span>
                  <span className="ml-2 text-sm text-gray-500">({profile.totalJobs} jobs)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
          <p className="text-gray-700">{profile.bio}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <BriefcaseIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Jobs</dt>
                    <dd className="text-lg font-semibold text-gray-900">{profile.totalJobs}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <StarIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                    <dd className="text-lg font-semibold text-gray-900">{profile.completedJobs}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <StarIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Rating</dt>
                    <dd className="text-lg font-semibold text-gray-900">{profile.rating}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Portfolio */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Portfolio</h2>
          <div className="space-y-4">
            {profile.portfolio.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-md font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

