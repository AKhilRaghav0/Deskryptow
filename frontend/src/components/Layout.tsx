import { ReactNode, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import FloatingDock from './FloatingDock'
import GridBackground from './GridBackground'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const isChatPage = location.pathname.startsWith('/chat')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Check if modal is open by observing body class
  useEffect(() => {
    const checkModal = () => {
      setIsModalOpen(document.body.classList.contains('modal-open'))
    }

    // Initial check
    checkModal()

    // Watch for class changes
    const observer = new MutationObserver(checkModal)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-[#EEEEEE] relative">
      <GridBackground />
      <FloatingDock />
      
      {/* Main content */}
      <main className="relative z-10 w-full pb-24 md:pb-0">
        {children}
      </main>

      {/* Footer - Hidden on chat page and when modal is open */}
      {!isChatPage && !isModalOpen && (
        <footer className="relative z-10 mt-32 border-t-2 border-[#1D1616] bg-white/80 backdrop-blur-xl pb-24 md:pb-16">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#1D1616] flex items-center justify-center mr-3 shadow-card">
                  <span className="text-white font-bold">D</span>
                </div>
                <span className="text-xl font-display font-bold text-[#1D1616]">Deskryptow</span>
              </div>
              <p className="text-sm text-[#1D1616] leading-relaxed">Decentralized freelance escrow platform powered by blockchain technology.</p>
            </div>
            <div>
              <h3 className="font-bold text-[#1D1616] mb-6 text-lg">Platform</h3>
              <ul className="space-y-3 text-sm text-[#1D1616]">
                <li><a href="/jobs" className="hover:text-[#D84040] transition-colors font-medium">Browse Jobs</a></li>
                <li><a href="/post-job" className="hover:text-[#D84040] transition-colors font-medium">Post a Job</a></li>
                <li><a href="/dashboard" className="hover:text-[#D84040] transition-colors font-medium">Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-[#1D1616] mb-6 text-lg">Resources</h3>
              <ul className="space-y-3 text-sm text-[#1D1616]">
                <li><a href="#" className="hover:text-[#D84040] transition-colors font-medium">Documentation</a></li>
                <li><a href="#" className="hover:text-[#D84040] transition-colors font-medium">API</a></li>
                <li><a href="#" className="hover:text-[#D84040] transition-colors font-medium">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-[#1D1616] mb-6 text-lg">Legal</h3>
              <ul className="space-y-3 text-sm text-[#1D1616]">
                <li><a href="#" className="hover:text-[#D84040] transition-colors font-medium">Privacy</a></li>
                <li><a href="#" className="hover:text-[#D84040] transition-colors font-medium">Terms</a></li>
                <li><a href="#" className="hover:text-[#D84040] transition-colors font-medium">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t-2 border-[#1D1616] text-center">
            <p className="text-sm text-[#1D1616] font-medium">
              © {new Date().getFullYear()} Deskryptow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      )}
    </div>
  )
}
