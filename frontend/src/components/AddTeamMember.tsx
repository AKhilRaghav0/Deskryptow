import { useState } from 'react'
import { UserPlusIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useWallet } from '../contexts/WalletContext'
import axios from 'axios'
import { config } from '../config'
import toast from 'react-hot-toast'

interface AddTeamMemberProps {
  jobId: string
  clientAddress: string
  onMemberAdded?: () => void
}

export default function AddTeamMember({ jobId, clientAddress, onMemberAdded }: AddTeamMemberProps) {
  const { address, isConnected } = useWallet()
  const [walletAddress, setWalletAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected || address?.toLowerCase() !== clientAddress.toLowerCase()) {
      toast.error('Only the job owner can add team members')
      return
    }

    if (!walletAddress.trim()) {
      toast.error('Please enter a wallet address')
      return
    }

    // Basic wallet address validation
    const addressRegex = /^0x[a-fA-F0-9]{40}$/
    if (!addressRegex.test(walletAddress.trim())) {
      toast.error('Invalid wallet address format')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      
      // First, ensure the user exists in the system
      await axios.post(
        `${config.apiUrl}/api/v1/users/`,
        {
          wallet_address: walletAddress.trim().toLowerCase(),
          username: `User_${walletAddress.slice(2, 10)}`,
          role: 'freelancer',
        },
        {
          headers: token ? {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          } : {
            'Content-Type': 'application/json',
          },
        }
      )

      toast.success('Team member added successfully!')
      setWalletAddress('')
      setIsOpen(false)
      onMemberAdded?.()
    } catch (error: any) {
      console.error('Error adding team member:', error)
      if (error.response?.status === 400) {
        toast.error('User already exists (this is OK)')
        setWalletAddress('')
        setIsOpen(false)
        onMemberAdded?.()
      } else {
        toast.error('Failed to add team member')
      }
    } finally {
      setLoading(false)
    }
  }

  // Only show if user is the job owner
  if (!isConnected || address?.toLowerCase() !== clientAddress.toLowerCase()) {
    return null
  }

  return (
    <div className="mt-6">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-base font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all shadow-lg hover:scale-105 border-2 border-[#D84040]"
        >
          <UserPlusIcon className="h-5 w-5" />
          Add Team Member
        </button>
      ) : (
        <div className="bg-white rounded-2xl p-6 border-2 border-[#1D1616] shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-display font-bold text-[#1D1616]">Add Team Member</h3>
            <button
              onClick={() => {
                setIsOpen(false)
                setWalletAddress('')
              }}
              className="p-2 rounded-xl text-[#1D1616] hover:bg-[#EEEEEE] transition-all"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label htmlFor="member-wallet" className="block text-sm font-bold text-[#1D1616] mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                id="member-wallet"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="block w-full px-4 py-3 border-2 border-[#1D1616] rounded-xl bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] text-[#1D1616] font-mono text-sm"
                required
              />
              <p className="mt-2 text-xs text-[#1D1616]">
                Enter the wallet address of the team member you want to add
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#D84040]"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    Add Member
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setWalletAddress('')
                }}
                className="px-6 py-3 rounded-xl text-base font-bold text-[#1D1616] bg-[#EEEEEE] hover:bg-[#E5E5E5] transition-all border-2 border-[#1D1616]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

