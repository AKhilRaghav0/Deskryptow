import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BriefcaseIcon, ClockIcon, CheckCircleIcon, ArrowTrendingUpIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useWallet } from '../contexts/WalletContext'
import { config } from '../config'
import axios from 'axios'
import toast from 'react-hot-toast'

type TabType = 'active' | 'completed' | 'proposals'

interface Job {
  id: string
  title: string
  status: string
  budget: number
  deadline: string
  created_at: string
  updated_at: string
  client_address: string
  freelancer_address?: string
}

interface Proposal {
  id: string
  job_id: string
  status: string
  created_at: string
  job?: Job
}

export default function Dashboard() {
  const { address, isConnected } = useWallet()
  const [activeTab, setActiveTab] = useState<TabType>('active')
  const [loading, setLoading] = useState(true)
  const [activeJobs, setActiveJobs] = useState<Job[]>([])
  const [completedJobs, setCompletedJobs] = useState<Job[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [stats, setStats] = useState({
    activeJobs: 0,
    completedJobs: 0,
    pendingProposals: 0,
  })

  useEffect(() => {
    if (isConnected && address) {
      fetchDashboardData()
    }
  }, [isConnected, address])

  const fetchDashboardData = async () => {
    if (!address) return

    try {
      setLoading(true)
      
      // Fetch all jobs where user is client
      const clientJobsResponse = await axios.get(
        `${config.apiUrl}/api/v1/jobs/client/${address}`
      )
      const clientJobs: Job[] = clientJobsResponse.data

      // Fetch all jobs where user is freelancer
      const freelancerJobsResponse = await axios.get(
        `${config.apiUrl}/api/v1/jobs/freelancer/${address}`
      )
      const freelancerJobs: Job[] = freelancerJobsResponse.data

      // Combine and filter jobs
      const allJobs = [...clientJobs, ...freelancerJobs]
      
      // Active jobs: in_progress or submitted
      const active = allJobs.filter(
        (job) => job.status === 'in_progress' || job.status === 'submitted'
      )
      setActiveJobs(active)

      // Completed jobs
      const completed = allJobs.filter((job) => job.status === 'completed')
      setCompletedJobs(completed)

      // Fetch proposals
      const proposalsResponse = await axios.get(
        `${config.apiUrl}/api/v1/proposals/freelancer/${address}`
      )
      const allProposals: Proposal[] = proposalsResponse.data

      // Fetch job details for proposals
      const proposalsWithJobs = await Promise.all(
        allProposals.map(async (proposal) => {
          try {
            const jobResponse = await axios.get(
              `${config.apiUrl}/api/v1/jobs/${proposal.job_id}`
            )
            return { ...proposal, job: jobResponse.data }
          } catch (error) {
            return proposal
          }
        })
      )
      setProposals(proposalsWithJobs)

      // Calculate stats
      setStats({
        activeJobs: active.length,
        completedJobs: completed.length,
        pendingProposals: allProposals.filter((p) => p.status === 'pending').length,
      })
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || !error.response) {
        toast.error('Cannot connect to backend server. Please make sure the backend is running.')
      } else {
        toast.error('Failed to load dashboard data')
      }
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'active' as TabType, name: 'Active Jobs', count: stats.activeJobs },
    { id: 'completed' as TabType, name: 'Completed', count: stats.completedJobs },
    { id: 'proposals' as TabType, name: 'Proposals', count: stats.pendingProposals },
  ]

  return (
    <div className="w-full">
      {/* Header Section */}
      <section className="w-full py-16 bg-white border-b-2 border-[#1D1616]">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#1D1616] text-white text-sm font-bold mb-6 border-2 border-[#1D1616]">
            <SparklesIcon className="h-4 w-4 mr-2.5 text-[#D84040]" />
            Your Workspace
          </div>
          <h1 className="text-6xl sm:text-7xl font-display font-bold text-[#1D1616] mb-4">Dashboard</h1>
          <p className="text-2xl text-[#1D1616]">Manage your jobs and proposals in one place</p>
        </div>
      </section>

      {/* Stats Section - Full Width */}
      <section className="w-full py-16 bg-[#EEEEEE]">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl shadow-elevated p-8 border-2 border-[#1D1616] hover:scale-105 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="flex-shrink-0 bg-[#EEEEEE] rounded-2xl p-4 border-2 border-[#1D1616]">
                  <BriefcaseIcon className="h-8 w-8 text-[#D84040]" />
                </div>
                <ArrowTrendingUpIcon className="h-6 w-6 text-[#D84040]" />
              </div>
              <p className="text-base font-semibold text-[#1D1616] mb-2">Active Jobs</p>
              <p className="text-4xl font-display font-bold text-[#1D1616]">{stats.activeJobs}</p>
            </div>

            <div className="bg-white rounded-3xl shadow-elevated p-8 border-2 border-[#1D1616] hover:scale-105 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="flex-shrink-0 bg-[#EEEEEE] rounded-2xl p-4 border-2 border-[#1D1616]">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-base font-semibold text-[#1D1616] mb-2">Completed</p>
              <p className="text-4xl font-display font-bold text-[#1D1616]">{stats.completedJobs}</p>
            </div>

            <div className="bg-white rounded-3xl shadow-elevated p-8 border-2 border-[#1D1616] hover:scale-105 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="flex-shrink-0 bg-[#EEEEEE] rounded-2xl p-4 border-2 border-[#1D1616]">
                  <ClockIcon className="h-8 w-8 text-[#D84040]" />
                </div>
                <ArrowTrendingUpIcon className="h-6 w-6 text-[#D84040]" />
              </div>
              <p className="text-base font-semibold text-[#1D1616] mb-2">Pending Proposals</p>
              <p className="text-4xl font-display font-bold text-[#1D1616]">{stats.pendingProposals}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section - Full Width */}
      <section className="w-full py-16">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="bg-white rounded-3xl shadow-elevated overflow-hidden border-2 border-[#1D1616]">
            <div className="border-b-2 border-[#1D1616]">
              <nav className="flex space-x-2 px-8" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-b-4 border-[#D84040] text-[#1D1616]'
                        : 'text-[#8E1616] hover:text-[#1D1616]'
                    } px-8 py-6 text-base font-bold transition-colors relative`}
                  >
                    {tab.name}
                    {tab.count > 0 && (
                      <span
                        className={`ml-3 py-1 px-3 rounded-full text-xs font-bold ${
                          activeTab === tab.id
                            ? 'bg-[#D84040] text-white'
                            : 'bg-[#EEEEEE] text-[#1D1616] border-2 border-[#1D1616]'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              {loading ? (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1D1616] border-t-transparent mb-4"></div>
                  <p className="text-[#1D1616] font-bold text-lg">Loading dashboard...</p>
                </div>
              ) : !isConnected ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-[#EEEEEE] flex items-center justify-center border-2 border-[#1D1616]">
                    <BriefcaseIcon className="h-10 w-10 text-[#1D1616]" />
                  </div>
                  <p className="text-[#1D1616] font-bold text-lg">Please connect your wallet to view your dashboard</p>
                </div>
              ) : (
                <>
                  {activeTab === 'active' && (
                    <div className="space-y-6">
                      {activeJobs.length === 0 ? (
                        <div className="text-center py-20">
                          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-[#EEEEEE] flex items-center justify-center border-2 border-[#1D1616]">
                            <BriefcaseIcon className="h-10 w-10 text-[#1D1616]" />
                          </div>
                          <p className="text-[#1D1616] font-bold text-lg">No active jobs</p>
                        </div>
                      ) : (
                        activeJobs.map((job) => (
                          <Link
                            key={job.id}
                            to={`/jobs/${job.id}`}
                            className="block border-2 border-[#1D1616] rounded-3xl p-8 hover:shadow-card transition-all hover:scale-[1.01]"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="text-2xl font-display font-bold text-[#1D1616] mb-4">{job.title}</h3>
                                <div className="flex items-center gap-8 text-base text-[#8E1616]">
                                  <span>Status: <span className="font-bold text-[#1D1616]">{job.status.replace('_', ' ').toUpperCase()}</span></span>
                                  <span>Deadline: <span className="font-bold text-[#1D1616]">
                                    {new Date(job.deadline).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </span></span>
                                </div>
                              </div>
                              <div className="text-right ml-8">
                                <p className="text-3xl font-display font-bold text-[#D84040]">{job.budget} ETH</p>
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'completed' && (
                    <div className="space-y-6">
                      {completedJobs.length === 0 ? (
                        <div className="text-center py-20">
                          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-[#EEEEEE] flex items-center justify-center border-2 border-[#1D1616]">
                            <CheckCircleIcon className="h-10 w-10 text-[#1D1616]" />
                          </div>
                          <p className="text-[#1D1616] font-bold text-lg">No completed jobs</p>
                        </div>
                      ) : (
                        completedJobs.map((job) => (
                          <Link
                            key={job.id}
                            to={`/jobs/${job.id}`}
                            className="block border-2 border-[#1D1616] rounded-3xl p-8 hover:shadow-card transition-all hover:scale-[1.01]"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="text-2xl font-display font-bold text-[#1D1616] mb-4">{job.title}</h3>
                                <p className="text-base text-[#8E1616]">
                                  Completed: {new Date(job.updated_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                              <div className="text-right ml-8">
                                <p className="text-3xl font-display font-bold text-[#D84040]">{job.budget} ETH</p>
                                <CheckCircleIcon className="h-6 w-6 text-green-600 mt-2 mx-auto" />
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'proposals' && (
                    <div className="space-y-6">
                      {proposals.length === 0 ? (
                        <div className="text-center py-20">
                          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-[#EEEEEE] flex items-center justify-center border-2 border-[#1D1616]">
                            <ClockIcon className="h-10 w-10 text-[#1D1616]" />
                          </div>
                          <p className="text-[#1D1616] font-bold text-lg">No proposals</p>
                        </div>
                      ) : (
                        proposals.map((proposal) => (
                          <div
                            key={proposal.id}
                            className="border-2 border-[#1D1616] rounded-3xl p-8 hover:shadow-card transition-all hover:scale-[1.01]"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="text-2xl font-display font-bold text-[#1D1616] mb-4">
                                  {proposal.job?.title || 'Job Title Not Available'}
                                </h3>
                                <div className="flex items-center gap-8 text-base text-[#8E1616]">
                                  <span>Status: <span className="font-bold text-[#1D1616]">{proposal.status.toUpperCase()}</span></span>
                                  <span>Submitted: <span className="font-bold text-[#1D1616]">
                                    {new Date(proposal.created_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </span></span>
                                </div>
                                {proposal.job && (
                                  <Link
                                    to={`/jobs/${proposal.job_id}`}
                                    className="mt-4 inline-block text-[#D84040] hover:text-[#8E1616] font-semibold"
                                  >
                                    View Job →
                                  </Link>
                                )}
                              </div>
                              {proposal.job && (
                                <div className="text-right ml-8">
                                  <p className="text-3xl font-display font-bold text-[#D84040]">{proposal.job.budget} ETH</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
