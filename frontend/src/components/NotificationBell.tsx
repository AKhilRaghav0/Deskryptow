import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BellIcon } from '@heroicons/react/24/outline'
import { useWallet } from '../contexts/WalletContext'
import { config } from '../config'
import axios from 'axios'
import toast from 'react-hot-toast'

interface NotificationCount {
  unread_count: number
  total_count: number
}

export default function NotificationBell() {
  const { address, isConnected } = useWallet()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isConnected && address) {
      fetchNotificationCount()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchNotificationCount()
      }, 30000)
      
      return () => clearInterval(interval)
    } else {
      setUnreadCount(0)
    }
  }, [isConnected, address])

  const fetchNotificationCount = async () => {
    if (!isConnected || !address) return
    
    try {
      const response = await axios.get(
        `${config.apiUrl}/api/v1/notifications/count`,
        {
          params: { user_address: address },
        }
      )
      setUnreadCount(response.data.unread_count || 0)
    } catch (error) {
      // Silently fail - don't spam errors
      console.error('Error fetching notification count:', error)
      setUnreadCount(0)
    }
  }

  if (!isConnected) {
    return null
  }

  return (
    <Link
      to="/notifications"
      className="relative w-12 h-12 rounded-2xl bg-white text-[#1D1616] hover:bg-[#EEEEEE] transition-all hover:scale-110 flex items-center justify-center border-2 border-[#1D1616] group"
      title="Notifications"
    >
      <BellIcon className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#D84040] text-white text-xs font-bold flex items-center justify-center border-2 border-white animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}

