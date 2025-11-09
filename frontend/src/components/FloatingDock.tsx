import { Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  BriefcaseIcon, 
  PlusCircleIcon, 
  UserCircleIcon,
  Squares2X2Icon,
  MagnifyingGlassIcon,
  Bars3Icon,
  BellIcon,
  ClipboardDocumentListIcon,
  BookmarkIcon,
  ChatBubbleLeftRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CurrencyDollarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import NotificationBell from './NotificationBell'
import { config } from '../config'
import axios from 'axios'

export default function FloatingDock() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDockCollapsed, setIsDockCollapsed] = useState(false)
  const [isEscrow, setIsEscrow] = useState(false)
  const { address, isConnected, isConnecting, connect, disconnect, formatAddress } = useWallet()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Check if modal is open (by checking for modal-open class on body)
  useEffect(() => {
    const checkModal = () => {
      setIsModalOpen(document.body.classList.contains('modal-open'))
    }
    
    // Check initially
    checkModal()
    
    // Watch for changes using MutationObserver
    const observer = new MutationObserver(checkModal)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  // Check if user is escrow
  useEffect(() => {
    const checkEscrowStatus = async () => {
      if (!isConnected || !address) {
        setIsEscrow(false)
        return
      }

      try {
        const response = await axios.get(
          `${config.apiUrl}/api/v1/jobs/escrow/check`,
          { params: { escrow_address: address } }
        )
        setIsEscrow(response.data.is_escrow || false)
      } catch (error) {
        console.error('Error checking escrow status:', error)
        setIsEscrow(false)
      }
    }

    checkEscrowStatus()
  }, [isConnected, address])

  const isActive = (path: string) => location.pathname === path

  // Limited navigation for escrow users
  const escrowNavItems = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/escrow', label: 'Escrow', icon: CurrencyDollarIcon },
  ]

  // Full navigation for regular users
  const regularNavItems = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/jobs', label: 'Jobs', icon: BriefcaseIcon },
    { path: '/post-job', label: 'Post', icon: PlusCircleIcon },
    { path: '/transfer', label: 'Transfer', icon: ArrowRightIcon },
    { path: '/chat', label: 'Chat', icon: ChatBubbleLeftRightIcon },
    { path: '/my-jobs', label: 'My Jobs', icon: ClipboardDocumentListIcon },
    { path: '/saved-jobs', label: 'Saved', icon: BookmarkIcon },
    { path: '/dashboard', label: 'Dashboard', icon: Squares2X2Icon },
  ]

  const navItems = isEscrow ? escrowNavItems : regularNavItems

  // Profile path - use connected address or show connect prompt
  const profilePath = isConnected && address ? `/profile/${address}` : null

  // Don't render dock if modal is open (but allow on chat page - user can collapse with chevron)
  if (isModalOpen) {
    return null
  }

  return (
    <>
      {/* Desktop Floating Dock */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30 hidden md:block">
        {/* Toggle Button - Always visible, positioned above dock */}
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className={`
            absolute -top-12 left-1/2 transform -translate-x-1/2
            w-10 h-10 rounded-full
            bg-white/95 backdrop-blur-2xl
            border-2 border-[#1D1616]
            shadow-lg
            flex items-center justify-center
            hover:bg-[#EEEEEE] transition-all
            hover:scale-110
            z-40
            ${isDockCollapsed ? 'rotate-180' : ''}
          `}
          aria-label={isDockCollapsed ? 'Show dock' : 'Hide dock'}
        >
          {isDockCollapsed ? (
            <ChevronUpIcon className="h-6 w-6 text-[#1D1616]" />
          ) : (
            <ChevronDownIcon className="h-6 w-6 text-[#1D1616]" />
          )}
        </button>

        {/* Dock Container */}
        <nav className={`
          flex items-center gap-2 px-6 py-4 rounded-3xl
          bg-white/95 backdrop-blur-2xl
          border-2 border-[#1D1616]
          shadow-2xl
          transition-all duration-500
          ${scrolled ? 'scale-105' : 'scale-100'}
          ${isDockCollapsed ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 pointer-events-auto translate-y-0'}
        `}>
          {/* Logo */}
          <Link to="/" className="flex items-center mr-2 group">
            <div className="w-10 h-10 rounded-xl bg-[#1D1616] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <span className="text-white font-bold text-sm">D</span>
            </div>
          </Link>

          {/* Navigation Items */}
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  relative flex items-center justify-center
                  w-12 h-12 rounded-2xl
                  transition-all duration-300
                  group
                  ${isActive(item.path)
                    ? 'bg-[#1D1616] text-white shadow-lg scale-110'
                    : 'bg-white text-[#1D1616] hover:bg-[#EEEEEE] hover:scale-110 border-2 border-[#1D1616]'
                  }
                `}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
              </Link>
            )
          })}

              {/* Search Button */}
              <div className="w-px h-8 bg-[#1D1616] mx-2"></div>
              <Link
                to="/search"
                className="w-12 h-12 rounded-2xl bg-white text-[#1D1616] hover:bg-[#EEEEEE] transition-all hover:scale-110 flex items-center justify-center border-2 border-[#1D1616]"
                title="Search Jobs"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </Link>

              {/* Notifications Button */}
              <div className="w-px h-8 bg-[#1D1616] mx-2"></div>
              <NotificationBell />

              {/* Profile Button */}
          <div className="w-px h-8 bg-[#1D1616] mx-2"></div>
          {profilePath ? (
            <Link
              to={profilePath}
              className={`
                w-12 h-12 rounded-2xl
                transition-all duration-300
                flex items-center justify-center
                ${isActive(profilePath)
                  ? 'bg-[#1D1616] text-white shadow-lg scale-110'
                  : 'bg-white text-[#1D1616] hover:bg-[#EEEEEE] hover:scale-110 border-2 border-[#1D1616]'
                }
              `}
              title="My Profile"
            >
              <UserCircleIcon className="h-5 w-5" />
            </Link>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="w-12 h-12 rounded-2xl bg-white text-[#1D1616] hover:bg-[#EEEEEE] transition-all hover:scale-110 flex items-center justify-center border-2 border-[#1D1616] disabled:opacity-50 disabled:cursor-not-allowed"
              title="Connect to view profile"
            >
              <UserCircleIcon className="h-5 w-5" />
            </button>
          )}

          {/* Connect Wallet Button */}
          <div className="w-px h-8 bg-[#1D1616] mx-2"></div>
          {isConnected ? (
            <button
              onClick={disconnect}
              className="px-4 py-2 rounded-2xl text-sm font-bold text-white bg-[#1D1616] hover:bg-[#2A1F1F] transition-all shadow-lg hover:scale-105 flex items-center gap-2 border-2 border-[#1D1616]"
              title={address || ''}
            >
              <UserCircleIcon className="h-4 w-4" />
              <span className="hidden lg:inline">{formatAddress(address!)}</span>
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="px-4 py-2 rounded-2xl text-sm font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all shadow-lg hover:scale-105 flex items-center gap-2 border-2 border-[#D84040] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserCircleIcon className="h-4 w-4" />
              <span className="hidden lg:inline">{isConnecting ? 'Connecting...' : 'Connect'}</span>
            </button>
          )}
        </nav>
      </div>

      {/* Mobile Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-30 md:hidden bg-white/95 backdrop-blur-xl border-b-2 border-[#1D1616]">
        <div className="flex justify-between items-center h-16 px-4">
          <Link to="/" className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-[#1D1616] flex items-center justify-center mr-2">
              <span className="text-white font-bold">D</span>
            </div>
            <span className="text-xl font-display font-bold text-[#1D1616]">Deskryptow</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-xl text-[#1D1616] hover:bg-[#EEEEEE] transition-all flex items-center justify-center border-2 border-[#1D1616]"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t-2 border-[#1D1616] bg-white/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-2xl text-base font-bold transition-all ${
                      isActive(item.path)
                        ? 'bg-[#1D1616] text-white shadow-lg'
                        : 'text-[#1D1616] hover:bg-[#EEEEEE]'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                )
              })}
              <Link
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-2xl text-base font-bold transition-all ${
                  isActive('/notifications')
                    ? 'bg-[#1D1616] text-white shadow-lg'
                    : 'text-[#1D1616] hover:bg-[#EEEEEE]'
                }`}
              >
                <BellIcon className="h-5 w-5 mr-3" />
                Notifications
              </Link>
              <Link
                to="/saved-jobs"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-2xl text-base font-bold transition-all ${
                  isActive('/saved-jobs')
                    ? 'bg-[#1D1616] text-white shadow-lg'
                    : 'text-[#1D1616] hover:bg-[#EEEEEE]'
                }`}
              >
                <BookmarkIcon className="h-5 w-5 mr-3" />
                Saved Jobs
              </Link>
              {profilePath && (
                <Link
                  to={profilePath}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-2xl text-base font-bold transition-all ${
                    isActive(profilePath)
                      ? 'bg-[#1D1616] text-white shadow-lg'
                      : 'text-[#1D1616] hover:bg-[#EEEEEE]'
                  }`}
                >
                  <UserCircleIcon className="h-5 w-5 mr-3" />
                  Profile
                </Link>
              )}
              <div className="pt-2 border-t-2 border-[#1D1616] mt-2">
                {isConnected ? (
                  <button
                    onClick={() => {
                      disconnect()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center px-4 py-3 rounded-2xl text-base font-bold text-white bg-[#1D1616] shadow-lg"
                  >
                    <UserCircleIcon className="h-5 w-5 mr-3" />
                    {formatAddress(address!)}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      connect()
                      setMobileMenuOpen(false)
                    }}
                    disabled={isConnecting}
                    className="w-full flex items-center px-4 py-3 rounded-2xl text-base font-bold text-white bg-[#D84040] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserCircleIcon className="h-5 w-5 mr-3" />
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
