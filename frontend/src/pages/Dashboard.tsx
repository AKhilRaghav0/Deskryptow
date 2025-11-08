import { useState } from 'react'
import { BriefcaseIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

type TabType = 'active' | 'completed' | 'proposals'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('active')

  // Mock data - replace with actual API calls
  const activeJobs = [
    {
      id: 1,
      title: 'React Developer Needed',
      status: 'In Progress',
      budget: '0.5 ETH',
      deadline: '2024-02-15',
    },
  ]

  const completedJobs = [
    {
      id: 2,
      title: 'UI/UX Design Project',
      status: 'Completed',
      budget: '0.3 ETH',
      completedAt: '2024-01-20',
    },
  ]

  const proposals = [
    {
      id: 1,
      jobTitle: 'Blockchain Developer',
      status: 'Pending',
      proposedAmount: '0.8 ETH',
      submittedAt: '2024-01-25',
    },
  ]

  const tabs = [
    { id: 'active' as TabType, name: 'Active Jobs', count: activeJobs.length },
    { id: 'completed' as TabType, name: 'Completed', count: completedJobs.length },
    { id: 'proposals' as TabType, name: 'Proposals', count: proposals.length },
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your jobs and proposals
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <BriefcaseIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Jobs</dt>
                  <dd className="text-lg font-semibold text-gray-900">{activeJobs.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg font-semibold text-gray-900">{completedJobs.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Proposals</dt>
                  <dd className="text-lg font-semibold text-gray-900">{proposals.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.name}
                {tab.count > 0 && (
                  <span
                    className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'active' && (
            <div className="space-y-4">
              {activeJobs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No active jobs</p>
              ) : (
                activeJobs.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">Status: {job.status}</p>
                        <p className="text-sm text-gray-500">Deadline: {job.deadline}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-indigo-600">{job.budget}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="space-y-4">
              {completedJobs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No completed jobs</p>
              ) : (
                completedJobs.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">Completed: {job.completedAt}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{job.budget}</p>
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'proposals' && (
            <div className="space-y-4">
              {proposals.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No proposals</p>
              ) : (
                proposals.map((proposal) => (
                  <div key={proposal.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{proposal.jobTitle}</h3>
                        <p className="text-sm text-gray-500 mt-1">Status: {proposal.status}</p>
                        <p className="text-sm text-gray-500">Submitted: {proposal.submittedAt}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-indigo-600">{proposal.proposedAmount}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

