import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  BellIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  SparklesIcon,
  BriefcaseIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowRightIcon,
  UserIcon,
  PaperClipIcon,
  ArrowUturnLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useWallet } from '../contexts/WalletContext'
import { config } from '../config'
import axios from 'axios'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  user_address: string
  type: string
  title: string
  message: string
  related_job_id?: string
  related_proposal_id?: string
  is_read: boolean
  created_at: string
}

interface Job {
  id: string
  title: string
  description: string
  budget: number
  category: string
  deadline: string
  status: string
  client_address: string
  freelancer_address?: string
  skills_required: string[]
  tags: string[]
  proposal_count: number
  created_at: string
  updated_at: string
}

interface Proposal {
  id: string
  job_id: string
  freelancer_address: string
  cover_letter: string
  proposed_timeline: string
  portfolio_links: string[]
  status: string
  created_at: string
  updated_at: string
}

interface NotificationWithJob extends Notification {
  job?: Job
  proposal?: Proposal
}

export default function Notifications() {
  const navigate = useNavigate()
  const { address, isConnected } = useWallet()
  const [notifications, setNotifications] = useState<NotificationWithJob[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set())
  const [collapsedNotifications, setCollapsedNotifications] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'action' | 'completed'>('action')

  useEffect(() => {
    if (isConnected && address) {
      fetchNotifications()
      fetchNotificationCount()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchNotifications()
        fetchNotificationCount()
      }, 30000)
      
      return () => clearInterval(interval)
    } else {
      setLoading(false)
    }
  }, [isConnected, address])

  const fetchNotifications = async () => {
    if (!isConnected || !address) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const response = await axios.get(
        `${config.apiUrl}/api/v1/notifications/`,
        {
          params: { user_address: address },
        }
      )
      
      // Handle empty response
      if (!response.data || response.data.length === 0) {
        setNotifications([])
        setLoading(false)
        return
      }
      
      // Fetch job and proposal details for each notification
      const notificationsWithDetails = await Promise.all(
        response.data.map(async (notification: Notification) => {
          const result: NotificationWithJob = { ...notification }
          
          // Fetch job details if available
          if (notification.related_job_id) {
            try {
              const jobResponse = await axios.get(
                `${config.apiUrl}/api/v1/jobs/${notification.related_job_id}`
              )
              result.job = jobResponse.data
            } catch (error) {
              console.error(`Error fetching job ${notification.related_job_id}:`, error)
              // Continue without job details
            }
          }
          
          // Fetch proposal details if available
          if (notification.related_proposal_id) {
            try {
              const proposalResponse = await axios.get(
                `${config.apiUrl}/api/v1/proposals/${notification.related_proposal_id}`
              )
              result.proposal = proposalResponse.data
            } catch (error) {
              console.error(`Error fetching proposal ${notification.related_proposal_id}:`, error)
              // Continue without proposal details
            }
          }
          
          return result
        })
      )
      
      setNotifications(notificationsWithDetails)
    } catch (error: any) {
      console.error('Error fetching notifications:', error)
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || !error.response) {
        toast.error('Cannot connect to backend server. Please make sure the backend is running.')
        setNotifications([])
      } else if (error.response?.status === 404) {
        // No notifications found - this is okay
        setNotifications([])
      } else {
        toast.error(error.response?.data?.detail || 'Failed to load notifications')
        setNotifications([])
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchNotificationCount = async () => {
    if (!isConnected || !address) return
    
    try {
      const response = await axios.get(
        `${config.apiUrl}/api/v1/notifications/count`,
        {
          params: { user_address: address },
        }
      )
      setUnreadCount(response.data.unread_count)
    } catch (error) {
      console.error('Error fetching notification count:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!isConnected || !address) return
    
    try {
      await axios.put(
        `${config.apiUrl}/api/v1/notifications/${notificationId}/read`,
        {},
        {
          params: { user_address: address },
        }
      )
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  const markAllAsRead = async () => {
    if (!isConnected || !address) return
    
    try {
      await axios.put(
        `${config.apiUrl}/api/v1/notifications/read-all`,
        {},
        {
          params: { user_address: address },
        }
      )
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all notifications as read')
    }
  }

  const acceptProposal = async (proposalId: string, notificationId: string) => {
    if (!isConnected || !address) return
    
    setProcessingActions(prev => new Set(prev).add(proposalId))
    
    try {
      await axios.put(`${config.apiUrl}/api/v1/proposals/${proposalId}/accept`)
      toast.success('Proposal accepted!')
      markAsRead(notificationId)
      // Collapse the notification after accepting
      setCollapsedNotifications(prev => new Set(prev).add(notificationId))
      // Refresh notifications to get updated job status
      fetchNotifications()
    } catch (error: any) {
      console.error('Error accepting proposal:', error)
      toast.error(error.response?.data?.detail || 'Failed to accept proposal')
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(proposalId)
        return newSet
      })
    }
  }

  const rejectProposal = async (proposalId: string, notificationId: string) => {
    if (!isConnected || !address) return
    
    setProcessingActions(prev => new Set(prev).add(proposalId))
    
    try {
      await axios.put(`${config.apiUrl}/api/v1/proposals/${proposalId}/reject`)
      toast.success('Proposal rejected')
      markAsRead(notificationId)
      // Remove notification from list since proposal is rejected
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      fetchNotificationCount()
    } catch (error: any) {
      console.error('Error rejecting proposal:', error)
      toast.error(error.response?.data?.detail || 'Failed to reject proposal')
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(proposalId)
        return newSet
      })
    }
  }

  const withdrawProposal = async (proposalId: string, notificationId: string) => {
    if (!isConnected || !address) return
    
    if (!confirm('Are you sure you want to withdraw this proposal? This action cannot be undone.')) {
      return
    }
    
    setProcessingActions(prev => new Set(prev).add(proposalId))
    
    try {
      await axios.put(
        `${config.apiUrl}/api/v1/proposals/${proposalId}/withdraw`,
        {},
        {
          params: { freelancer_address: address },
        }
      )
      toast.success('Proposal withdrawn successfully')
      markAsRead(notificationId)
      // Remove notification from list since proposal is deleted
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      fetchNotificationCount()
    } catch (error: any) {
      console.error('Error withdrawing proposal:', error)
      toast.error(error.response?.data?.detail || 'Failed to withdraw proposal')
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(proposalId)
        return newSet
      })
    }
  }

  const toggleCollapse = (notificationId: string) => {
    setCollapsedNotifications(prev => {
      const newSet = new Set(prev)
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId)
      } else {
        newSet.add(notificationId)
      }
      return newSet
    })
  }

  // Separate notifications into action required and completed
  const hasAction = (notification: NotificationWithJob): boolean => {
    // Job owners can accept/reject proposals
    if (notification.type === 'proposal_received' && notification.related_proposal_id) {
      return true
    }
    // Freelancers can withdraw pending proposals
    if (notification.proposal && 
        notification.proposal.freelancer_address.toLowerCase() === address?.toLowerCase() &&
        notification.proposal.status === 'pending') {
      return true
    }
    return false
  }

  const actionRequiredNotifications = notifications.filter(n => hasAction(n))
  const completedNotifications = notifications.filter(n => !hasAction(n))

  // Set default tab based on which has notifications
  useEffect(() => {
    if (actionRequiredNotifications.length > 0) {
      setActiveTab('action')
    } else if (completedNotifications.length > 0) {
      setActiveTab('completed')
    }
  }, [actionRequiredNotifications.length, completedNotifications.length])

  // Notification Card Component
  const NotificationCard = ({
    notification,
    isCollapsed,
    onToggleCollapse,
    onMarkAsRead,
    onAcceptProposal,
    onRejectProposal,
    onWithdrawProposal,
    processingActions,
    address,
  }: {
    notification: NotificationWithJob
    isCollapsed: boolean
    onToggleCollapse: () => void
    onMarkAsRead: (id: string) => void
    onAcceptProposal: (proposalId: string, notificationId: string) => void
    onRejectProposal: (proposalId: string, notificationId: string) => void
    onWithdrawProposal: (proposalId: string, notificationId: string) => void
    processingActions: Set<string>
    address: string | null
  }) => {
    const hasActions = hasAction(notification)
    
    return (
      <div
        className={`bg-white rounded-3xl border-2 shadow-xl transition-all hover:shadow-2xl ${
          notification.is_read
            ? getNotificationColor(notification.type)
            : `${getNotificationColor(notification.type)} border-[#D84040] border-2`
        }`}
      >
        {/* Header - Always Visible */}
        <div className="p-6 border-b-2 border-[#1D1616]">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-display font-bold text-[#1D1616] mb-2">
                    {notification.title}
                  </h3>
                  <p className="text-base text-[#1D1616] mb-2 leading-relaxed">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-[#8E1616]">
                    <span>
                      {new Date(notification.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.is_read && (
                    <button
                      onClick={() => onMarkAsRead(notification.id)}
                      className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1D1616] hover:bg-[#2A1F1F] transition-all border-2 border-[#1D1616]"
                    >
                      Mark Read
                    </button>
                  )}
                  {!hasActions && (
                    <button
                      onClick={onToggleCollapse}
                      className="flex-shrink-0 p-2 rounded-xl text-[#1D1616] hover:bg-[#EEEEEE] transition-all border-2 border-[#1D1616]"
                    >
                      {isCollapsed ? (
                        <ChevronDownIcon className="h-5 w-5" />
                      ) : (
                        <ChevronUpIcon className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Content */}
        {!isCollapsed && (
          <div className="p-6 space-y-6">
            {/* Job Details */}
            {notification.job && (
              <div className="p-6 bg-[#EEEEEE] rounded-2xl border-2 border-[#1D1616]">
                <h4 className="text-lg font-bold text-[#1D1616] mb-4 flex items-center">
                  <BriefcaseIcon className="h-5 w-5 mr-2 text-[#D84040]" />
                  Job Details
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-[#8E1616] mb-1">Job Title</p>
                    <p className="text-base font-bold text-[#1D1616]">{notification.job.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#8E1616] mb-1 flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                        Budget
                      </p>
                      <p className="text-base font-bold text-[#D84040]">{notification.job.budget} ETH</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#8E1616] mb-1 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Deadline
                      </p>
                      <p className="text-base font-bold text-[#1D1616]">
                        {new Date(notification.job.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  {notification.job.description && (
                    <div>
                      <p className="text-sm font-semibold text-[#8E1616] mb-1">Description</p>
                      <p className="text-sm text-[#1D1616] line-clamp-3">
                        {notification.job.description.replace(/[#*`]/g, '').substring(0, 200)}
                        {notification.job.description.length > 200 ? '...' : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Proposal Details */}
            {notification.proposal && (
              <div className="p-6 bg-white rounded-2xl border-2 border-[#D84040]">
                <h4 className="text-lg font-bold text-[#1D1616] mb-4 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-[#D84040]" />
                  Proposal Details
                </h4>
                <div className="space-y-4">
                  {notification.proposal.cover_letter && (
                    <div>
                      <p className="text-sm font-semibold text-[#8E1616] mb-2">Cover Letter</p>
                      <div className="prose prose-sm max-w-none text-[#1D1616] bg-[#EEEEEE] p-4 rounded-xl border border-[#1D1616]">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="text-[#1D1616] mb-2 leading-relaxed text-sm">{children}</p>,
                            strong: ({ children }) => <strong className="font-bold text-[#1D1616]">{children}</strong>,
                            em: ({ children }) => <em className="italic text-[#1D1616]">{children}</em>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2 text-[#1D1616] space-y-1 ml-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 text-[#1D1616] space-y-1 ml-2">{children}</ol>,
                          }}
                        >
                          {notification.proposal.cover_letter}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                  {notification.proposal.proposed_timeline && (
                    <div>
                      <p className="text-sm font-semibold text-[#8E1616] mb-1 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Proposed Timeline
                      </p>
                      <p className="text-base font-bold text-[#1D1616]">{notification.proposal.proposed_timeline}</p>
                    </div>
                  )}
                  {notification.proposal.portfolio_links && notification.proposal.portfolio_links.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-[#8E1616] mb-2 flex items-center">
                        <PaperClipIcon className="h-4 w-4 mr-1" />
                        Portfolio Links
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {notification.proposal.portfolio_links.map((link, index) => (
                          <a
                            key={index}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EEEEEE] text-[#D84040] hover:bg-[#E5E5E5] transition-all border border-[#D84040]"
                          >
                            {link.length > 40 ? `${link.substring(0, 37)}...` : link}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {notification.type === 'proposal_received' && notification.related_proposal_id && (
                <>
                  <button
                    onClick={() => onAcceptProposal(notification.related_proposal_id!, notification.id)}
                    disabled={processingActions.has(notification.related_proposal_id!)}
                    className="px-6 py-3 rounded-2xl text-sm font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all shadow-lg hover:scale-105 border-2 border-[#D84040] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    {processingActions.has(notification.related_proposal_id!) ? 'Accepting...' : 'Accept Proposal'}
                  </button>
                  <button
                    onClick={() => onRejectProposal(notification.related_proposal_id!, notification.id)}
                    disabled={processingActions.has(notification.related_proposal_id!)}
                    className="px-6 py-3 rounded-2xl text-sm font-bold text-[#1D1616] bg-[#EEEEEE] hover:bg-[#E5E5E5] transition-all border-2 border-[#1D1616] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    {processingActions.has(notification.related_proposal_id!) ? 'Rejecting...' : 'Reject Proposal'}
                  </button>
                </>
              )}
              {notification.related_job_id && (
                <Link
                  to={`/jobs/${notification.related_job_id}`}
                  onClick={() => onMarkAsRead(notification.id)}
                  className="px-6 py-3 rounded-2xl text-sm font-bold text-white bg-[#1D1616] hover:bg-[#2A1F1F] transition-all shadow-lg hover:scale-105 border-2 border-[#1D1616] flex items-center"
                >
                  <ArrowRightIcon className="h-5 w-5 mr-2" />
                  View Job
                </Link>
              )}
              {notification.type === 'proposal_rejected' && (
                <Link
                  to="/jobs"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="px-6 py-3 rounded-2xl text-sm font-bold text-white bg-[#1D1616] hover:bg-[#2A1F1F] transition-all shadow-lg hover:scale-105 border-2 border-[#1D1616] flex items-center"
                >
                  <BriefcaseIcon className="h-5 w-5 mr-2" />
                  Browse Other Jobs
                </Link>
              )}
              {/* Withdraw button for freelancers who submitted proposals */}
              {notification.proposal && 
               notification.proposal.freelancer_address.toLowerCase() === address?.toLowerCase() &&
               notification.proposal.status === 'pending' && (
                <button
                  onClick={() => onWithdrawProposal(notification.proposal!.id, notification.id)}
                  disabled={processingActions.has(notification.proposal!.id)}
                  className="px-6 py-3 rounded-2xl text-sm font-bold text-[#1D1616] bg-[#EEEEEE] hover:bg-[#E5E5E5] transition-all border-2 border-[#1D1616] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
                  {processingActions.has(notification.proposal!.id) ? 'Withdrawing...' : 'Withdraw Proposal'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'proposal_received':
        return <BriefcaseIcon className="h-6 w-6 text-[#D84040]" />
      case 'proposal_accepted':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />
      case 'proposal_rejected':
        return <XCircleIcon className="h-6 w-6 text-gray-500" />
      default:
        return <BellIcon className="h-6 w-6 text-[#1D1616]" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'proposal_received':
        return 'bg-[#EEEEEE] border-[#D84040]'
      case 'proposal_accepted':
        return 'bg-green-50 border-green-200'
      case 'proposal_rejected':
        return 'bg-gray-50 border-gray-200'
      default:
        return 'bg-white border-[#1D1616]'
    }
  }

  if (!isConnected) {
    return (
      <div className="w-full flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto px-6">
          <BellIcon className="h-16 w-16 text-[#1D1616] mx-auto mb-6" />
          <h2 className="text-3xl font-display font-bold text-[#1D1616] mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-lg text-[#1D1616]">
            Please connect your MetaMask wallet to view notifications.
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
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#1D1616] text-white text-sm font-bold mb-6 border-2 border-[#1D1616]">
                <SparklesIcon className="h-4 w-4 mr-2.5 text-[#D84040]" />
                Notifications
              </div>
              <h1 className="text-6xl sm:text-7xl font-display font-bold text-[#1D1616] mb-4">
                Your Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-xl text-[#1D1616]">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-6 py-3 rounded-2xl text-sm font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all shadow-lg hover:scale-105 border-2 border-[#D84040]"
              >
                Mark All Read
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Notifications List */}
      <section className="w-full py-12 bg-[#EEEEEE]">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1D1616] border-t-transparent"></div>
              <p className="mt-4 text-[#1D1616]">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-[#1D1616] shadow-xl">
              <BellIcon className="h-16 w-16 text-[#1D1616] mx-auto mb-6 opacity-50" />
              <h2 className="text-2xl font-display font-bold text-[#1D1616] mb-4">
                No Notifications Yet
              </h2>
              <p className="text-lg text-[#1D1616] mb-8">
                You'll see notifications here when you receive proposals or updates on your jobs.
              </p>
              <Link
                to="/jobs"
                className="inline-flex items-center px-6 py-3 rounded-2xl text-sm font-bold text-white bg-[#1D1616] hover:bg-[#2A1F1F] transition-all shadow-lg hover:scale-105 border-2 border-[#1D1616]"
              >
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div>
              {/* Tabs */}
              <div className="flex gap-4 mb-8 border-b-2 border-[#1D1616]">
                <button
                  onClick={() => setActiveTab('action')}
                  className={`px-6 py-3 rounded-t-2xl text-base font-bold transition-all border-b-4 ${
                    activeTab === 'action'
                      ? 'bg-[#D84040] text-white border-[#D84040]'
                      : 'bg-[#EEEEEE] text-[#1D1616] border-transparent hover:bg-[#E5E5E5]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5" />
                    Action Required
                    {actionRequiredNotifications.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-white text-[#D84040]">
                        {actionRequiredNotifications.length}
                      </span>
                    )}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-6 py-3 rounded-t-2xl text-base font-bold transition-all border-b-4 ${
                    activeTab === 'completed'
                      ? 'bg-[#D84040] text-white border-[#D84040]'
                      : 'bg-[#EEEEEE] text-[#1D1616] border-transparent hover:bg-[#E5E5E5]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5" />
                    Completed
                    {completedNotifications.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-white text-[#D84040]">
                        {completedNotifications.length}
                      </span>
                    )}
                  </span>
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'action' && (
                <div className="space-y-6">
                  {actionRequiredNotifications.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border-2 border-[#1D1616]">
                      <SparklesIcon className="h-12 w-12 text-[#1D1616] mx-auto mb-4 opacity-50" />
                      <p className="text-lg text-[#1D1616]">No actions required</p>
                    </div>
                  ) : (
                    actionRequiredNotifications.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        isCollapsed={false}
                        onToggleCollapse={() => {}}
                        onMarkAsRead={markAsRead}
                        onAcceptProposal={acceptProposal}
                        onRejectProposal={rejectProposal}
                        onWithdrawProposal={withdrawProposal}
                        processingActions={processingActions}
                        address={address}
                      />
                    ))
                  )}
                </div>
              )}

              {activeTab === 'completed' && (
                <div className="space-y-6">
                  {completedNotifications.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border-2 border-[#1D1616]">
                      <CheckCircleIcon className="h-12 w-12 text-[#1D1616] mx-auto mb-4 opacity-50" />
                      <p className="text-lg text-[#1D1616]">No completed notifications</p>
                    </div>
                  ) : (
                    completedNotifications.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        isCollapsed={collapsedNotifications.has(notification.id)}
                        onToggleCollapse={() => toggleCollapse(notification.id)}
                        onMarkAsRead={markAsRead}
                        onAcceptProposal={acceptProposal}
                        onRejectProposal={rejectProposal}
                        onWithdrawProposal={withdrawProposal}
                        processingActions={processingActions}
                        address={address}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

