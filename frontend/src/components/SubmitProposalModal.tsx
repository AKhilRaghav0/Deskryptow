import { useState, useEffect } from 'react'
import { XMarkIcon, PaperClipIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useWallet } from '../contexts/WalletContext'
import axios from 'axios'
import { config } from '../config'
import toast from 'react-hot-toast'
import MarkdownEditor from './MarkdownEditor'

interface SubmitProposalModalProps {
  jobId: string
  jobTitle: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function SubmitProposalModal({
  jobId,
  jobTitle,
  isOpen,
  onClose,
  onSuccess,
}: SubmitProposalModalProps) {
  const { address, isConnected } = useWallet()
  const [formData, setFormData] = useState({
    cover_letter: '',
    proposed_timeline: '',
    portfolio_links: [] as string[],
  })
  const [portfolioLink, setPortfolioLink] = useState('')
  const [loading, setLoading] = useState(false)

  // Lock background scroll, hide dock, and hide footer when modal is open
  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      
      // Hide dock and footer by adding class to body
      document.body.classList.add('modal-open')
      
      // Also lock Lenis smooth scroll if available
      // Lenis instance is stored as __lenis in SmoothScroll component
      const lenisInstance = (window as any).__lenis
      if (lenisInstance && typeof lenisInstance.stop === 'function') {
        lenisInstance.stop()
      }
      
      // Also add class to stop Lenis scrolling
      document.documentElement.classList.add('lenis-stopped')
      document.body.classList.add('lenis-stopped')

      return () => {
        // Cleanup: restore scroll, show dock, and show footer
        document.body.style.overflow = originalOverflow
        document.body.classList.remove('modal-open')
        if (lenisInstance && typeof lenisInstance.start === 'function') {
          lenisInstance.start()
        }
        document.documentElement.classList.remove('lenis-stopped')
        document.body.classList.remove('lenis-stopped')
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !address) {
      toast.error('Please connect your wallet to submit a proposal')
      return
    }

    if (!formData.cover_letter.trim()) {
      toast.error('Please write a cover letter')
      return
    }

    if (!formData.proposed_timeline.trim()) {
      toast.error('Please provide a proposed timeline')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')

      await axios.post(
        `${config.apiUrl}/api/v1/proposals/`,
        {
          job_id: jobId,
          cover_letter: formData.cover_letter.trim(),
          proposed_timeline: formData.proposed_timeline.trim(),
          portfolio_links: formData.portfolio_links || [],
        },
        {
          params: { freelancer_address: address },
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              }
            : {
                'Content-Type': 'application/json',
              },
        }
      )

      toast.success('Proposal submitted successfully!')
      setFormData({
        cover_letter: '',
        proposed_timeline: '',
        portfolio_links: [],
      })
      setPortfolioLink('')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error submitting proposal:', error)

      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || !error.response) {
        toast.error('Cannot connect to backend server. Please make sure the backend is running.')
        return
      }

      if (error.response?.status === 400) {
        toast.error(error.response.data?.detail || 'Invalid proposal data')
        return
      }

      if (error.response?.status === 404) {
        toast.error('Job not found')
        return
      }

      const errorMessage = error.response?.data?.detail || error.message || 'Failed to submit proposal'
      toast.error(`Failed to submit proposal: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const addPortfolioLink = () => {
    if (portfolioLink.trim() && !formData.portfolio_links.includes(portfolioLink.trim())) {
      setFormData({
        ...formData,
        portfolio_links: [...formData.portfolio_links, portfolioLink.trim()],
      })
      setPortfolioLink('')
    }
  }

  const removePortfolioLink = (link: string) => {
    setFormData({
      ...formData,
      portfolio_links: formData.portfolio_links.filter((l) => l !== link),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#1D1616] w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 bg-white border-b-2 border-[#1D1616] p-4 sm:p-6 flex items-center justify-between rounded-t-3xl">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#1D1616] mb-1 sm:mb-2 truncate">Submit Proposal</h2>
            <p className="text-sm sm:text-base text-[#1D1616] truncate">Job: {jobTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-xl text-[#1D1616] hover:bg-[#EEEEEE] transition-all"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto modal-scrollbar p-4 sm:p-6" style={{ minHeight: 0 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Wallet Address */}
              <div className="bg-[#EEEEEE] rounded-2xl p-4 border-2 border-[#1D1616]">
                <p className="text-sm font-bold text-[#1D1616] mb-1">Submitting as:</p>
                <p className="text-base font-mono font-bold text-[#D84040] break-all">{address}</p>
              </div>

              {/* Proposed Timeline */}
              <div>
                <label htmlFor="timeline" className="block text-base font-bold text-[#1D1616] mb-4">
                  Proposed Timeline * <ClockIcon className="inline h-4 w-4" />
                </label>
                <input
                  type="text"
                  id="timeline"
                  required
                  value={formData.proposed_timeline}
                  onChange={(e) => setFormData({ ...formData, proposed_timeline: e.target.value })}
                  placeholder="e.g., 2 weeks, 1 month, 3-5 days"
                  className="block w-full px-6 py-4 border-2 border-[#1D1616] rounded-2xl bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] text-[#1D1616] font-semibold text-lg"
                />
              </div>

              {/* Portfolio Links */}
              <div>
                <label className="block text-base font-bold text-[#1D1616] mb-4">
                  Portfolio Links <PaperClipIcon className="inline h-4 w-4" />
                </label>
                <div className="flex gap-3 mb-3">
                  <input
                    type="url"
                    value={portfolioLink}
                    onChange={(e) => setPortfolioLink(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addPortfolioLink()
                      }
                    }}
                    placeholder="https://your-portfolio.com"
                    className="flex-1 px-6 py-4 border-2 border-[#1D1616] rounded-2xl bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] text-[#1D1616] font-semibold text-base"
                  />
                  <button
                    type="button"
                    onClick={addPortfolioLink}
                    className="px-6 py-4 rounded-2xl text-base font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all border-2 border-[#D84040]"
                  >
                    Add
                  </button>
                </div>
                {formData.portfolio_links.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto modal-scrollbar">
                    {formData.portfolio_links.map((link, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-4 py-2 bg-[#EEEEEE] rounded-xl border-2 border-[#1D1616]"
                      >
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-[#D84040] hover:text-[#8E1616] truncate flex-1"
                        >
                          {link}
                        </a>
                        <button
                          type="button"
                          onClick={() => removePortfolioLink(link)}
                          className="ml-3 p-1 rounded-lg text-[#1D1616] hover:bg-[#E5E5E5] transition-all"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Cover Letter */}
            <div>
              <label htmlFor="cover_letter" className="block text-base font-bold text-[#1D1616] mb-4">
                Cover Letter * (Markdown supported)
              </label>
              <MarkdownEditor
                value={formData.cover_letter}
                onChange={(value) => setFormData({ ...formData, cover_letter: value })}
                placeholder="Introduce yourself, explain why you're a good fit for this job, and highlight relevant experience..."
                rows={12}
              />
            </div>
          </div>

          {/* Actions - Fixed Footer inside form */}
          <div className="flex-shrink-0 flex gap-3 sm:gap-4 pt-4 border-t-2 border-[#1D1616] sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl text-sm sm:text-base font-bold text-[#1D1616] bg-[#EEEEEE] hover:bg-[#E5E5E5] transition-all border-2 border-[#1D1616]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl text-sm sm:text-base font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all border-2 border-[#D84040] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Submitting...</span>
                  <span className="sm:hidden">...</span>
                </span>
              ) : (
                'Submit Proposal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

