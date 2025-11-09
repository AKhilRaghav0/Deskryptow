import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { 
  BriefcaseIcon, 
  StarIcon, 
  CheckBadgeIcon, 
  SparklesIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'
import { useWallet } from '../contexts/WalletContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { config } from '../config'

interface UserProfile {
  wallet_address: string
  username: string
  email?: string
  bio?: string
  skills: string[]
  portfolio_url?: string
  reputation_score: number
  jobs_completed: number
}

interface UserStats {
  jobs_posted: number
  jobs_completed: number
  total_jobs: number
}

export default function Profile() {
  const { address: paramAddress } = useParams<{ address: string }>()
  const { address: connectedAddress, isConnected } = useWallet()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    bio: '',
    skills: [] as string[],
    portfolio_url: '',
  })
  const [skillInput, setSkillInput] = useState('')

  // Use connected address if viewing own profile, otherwise use param
  const profileAddress = paramAddress || connectedAddress || ''
  const isOwnProfile = !paramAddress || paramAddress.toLowerCase() === connectedAddress?.toLowerCase()

  useEffect(() => {
    if (profileAddress) {
      fetchProfile()
      fetchStats()
    }
  }, [profileAddress])

  const createProfile = async () => {
    if (!isConnected || !connectedAddress) {
      toast.error('Please connect your wallet to create a profile')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      
      // Ensure wallet address matches
      const walletToUse = profileAddress.toLowerCase()
      
      const response = await axios.post(
        `${config.apiUrl}/api/v1/users/`,
        {
          wallet_address: walletToUse,
          username: `User_${walletToUse.slice(2, 10)}`,
          role: 'both',
          email: null,
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

      setProfile(response.data)
      setEditForm({
        username: response.data.username || '',
        email: response.data.email || '',
        bio: response.data.bio || '',
        skills: response.data.skills || [],
        portfolio_url: response.data.portfolio_url || '',
      })
      toast.success('Profile created! You can now edit it.')
      setIsEditing(true) // Auto-open edit mode for new profiles
      fetchStats() // Refresh stats
    } catch (error: any) {
      console.error('Error creating profile:', error)
      
      // Handle network errors
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || !error.response) {
        toast.error('Cannot connect to backend server. Please make sure the backend is running on http://localhost:8000', {
          duration: 5000,
        })
        return
      }
      
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create profile'
      toast.error(`Failed to create profile: ${errorMessage}`, {
        duration: 4000,
      })
      
      // If user already exists, try to fetch it
      if (error.response?.status === 400 && errorMessage.includes('already exists')) {
        fetchProfile()
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/v1/users/${profileAddress}`)
      setProfile(response.data)
      setEditForm({
        username: response.data.username || '',
        email: response.data.email || '',
        bio: response.data.bio || '',
        skills: response.data.skills || [],
        portfolio_url: response.data.portfolio_url || '',
      })
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Profile doesn't exist
        if (isOwnProfile && isConnected) {
          // For own profile, show create option
          setProfile(null)
        } else {
          // For other profiles, show not found
          setProfile(null)
        }
      } else {
        toast.error('Failed to load profile')
        console.error('Error fetching profile:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/v1/users/${profileAddress}/stats`)
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleSave = async () => {
    if (!isConnected || !connectedAddress) {
      toast.error('Please connect your wallet to edit profile')
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      
      await axios.put(
        `${config.apiUrl}/api/v1/users/${connectedAddress}`,
        editForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      toast.success('Profile updated successfully!')
      setIsEditing(false)
      fetchProfile()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update profile')
      console.error('Error updating profile:', error)
    }
  }

  const addSkill = () => {
    if (skillInput.trim() && !editForm.skills.includes(skillInput.trim())) {
      setEditForm({
        ...editForm,
        skills: [...editForm.skills, skillInput.trim()],
      })
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => {
    setEditForm({
      ...editForm,
      skills: editForm.skills.filter(s => s !== skill),
    })
  }

  const getInitials = (address: string, username?: string): string => {
    if (username && username.length >= 2) {
      // Use first 2 letters of username
      return username.substring(0, 2).toUpperCase()
    }
    // Use first 2 characters of address (after 0x)
    return address.slice(2, 4).toUpperCase()
  }

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1D1616] border-t-transparent"></div>
          <p className="mt-4 text-[#1D1616] font-semibold">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    if (isOwnProfile && isConnected) {
      // Show create profile option for own profile
      return (
        <div className="w-full">
          {/* Header Section */}
          <section className="w-full py-16 bg-white border-b-2 border-[#1D1616]">
            <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#1D1616] text-white text-sm font-bold mb-6 border-2 border-[#1D1616]">
                <SparklesIcon className="h-4 w-4 mr-2.5 text-[#D84040]" />
                Create Profile
              </div>
              <h1 className="text-6xl sm:text-7xl font-display font-bold text-[#1D1616] mb-4">Create Your Profile</h1>
            </div>
          </section>

          {/* Create Profile Card */}
          <section className="w-full py-16">
            <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-3xl shadow-elevated p-12 border-2 border-[#1D1616] text-center">
                  <div className="w-32 h-32 rounded-3xl bg-[#D84040] flex items-center justify-center mx-auto mb-8 border-4 border-[#1D1616] shadow-xl">
                    <span className="text-6xl font-display font-bold text-white">
                      {getInitials(profileAddress, `User_${profileAddress.slice(2, 10)}`)}
                    </span>
                  </div>
                  <h2 className="text-3xl font-display font-bold text-[#1D1616] mb-4">
                    Welcome to Deskryptow!
                  </h2>
                  <p className="text-lg text-[#1D1616] mb-8 leading-relaxed">
                    Create your profile to start posting jobs or finding freelance opportunities. 
                    You can edit your profile anytime after creation.
                  </p>
                  <p className="text-sm text-[#1D1616] font-mono mb-8 bg-[#EEEEEE] p-4 rounded-2xl border-2 border-[#1D1616]">
                    {profileAddress}
                  </p>
                  <button
                    onClick={createProfile}
                    disabled={loading}
                    className="px-10 py-5 rounded-2xl text-lg font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all shadow-elevated hover:scale-105 border-2 border-[#D84040] inline-flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserCircleIcon className="h-6 w-6" />
                    {loading ? 'Creating...' : 'Create My Profile'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )
    } else {
      // Profile not found for other users
      return (
        <div className="w-full flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-24 h-24 rounded-3xl bg-[#EEEEEE] flex items-center justify-center mx-auto mb-6 border-2 border-[#1D1616]">
              <UserCircleIcon className="h-12 w-12 text-[#1D1616]" />
            </div>
            <h2 className="text-3xl font-display font-bold text-[#1D1616] mb-4">Profile Not Found</h2>
            <p className="text-lg text-[#1D1616] mb-6">
              This user hasn't created a profile yet.
            </p>
            <p className="text-sm text-[#1D1616] font-mono bg-[#EEEEEE] p-3 rounded-xl border border-[#1D1616]">
              {profileAddress}
            </p>
          </div>
        </div>
      )
    }
  }

  const initials = getInitials(profile.wallet_address, profile.username)

  return (
    <div className="w-full">
      {/* Header Section */}
      <section className="w-full py-16 bg-white border-b-2 border-[#1D1616]">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#1D1616] text-white text-sm font-bold mb-6 border-2 border-[#1D1616]">
            <SparklesIcon className="h-4 w-4 mr-2.5 text-[#D84040]" />
            Profile
          </div>
          <h1 className="text-6xl sm:text-7xl font-display font-bold text-[#1D1616] mb-4">User Profile</h1>
        </div>
      </section>

      {/* Profile Content - Full Width */}
      <section className="w-full py-16">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-6xl mx-auto">
            {/* Profile Header Card */}
            <div className="bg-white rounded-3xl shadow-elevated overflow-hidden mb-8 border-2 border-[#1D1616]">
              <div className="p-12">
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    <div className="flex-shrink-0">
                      {/* Avatar with 2-letter initials */}
                      <div className="w-36 h-36 rounded-3xl bg-[#D84040] flex items-center justify-center border-4 border-[#1D1616] shadow-xl">
                        <span className="text-5xl font-display font-bold text-white">{initials}</span>
                      </div>
                    </div>
                    <div className="ml-8 flex-1">
                      {isEditing ? (
                        <div className="space-y-4">
                          <input
                            type="text"
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            className="block w-full px-4 py-3 border-2 border-[#1D1616] rounded-2xl bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] text-[#1D1616] font-bold text-2xl"
                            placeholder="Username"
                          />
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="block w-full px-4 py-3 border-2 border-[#1D1616] rounded-2xl bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] text-[#1D1616] font-semibold"
                            placeholder="Email (optional)"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-4 mb-4">
                            <h1 className="text-4xl font-display font-bold text-[#1D1616]">{profile.username}</h1>
                            {profile.reputation_score > 4.5 && (
                              <CheckBadgeIcon className="h-7 w-7 text-[#D84040]" />
                            )}
                          </div>
                          {profile.email && (
                            <p className="text-xl text-[#1D1616] mb-4">{profile.email}</p>
                          )}
                          <p className="text-base text-[#1D1616] font-mono mb-6">{profile.wallet_address}</p>
                        </>
                      )}
                      <div className="flex items-center">
                        <StarIcon className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                        <span className="ml-2 text-2xl font-display font-bold text-[#1D1616]">
                          {profile.reputation_score.toFixed(1) || '0.0'}
                        </span>
                        <span className="ml-3 text-base text-[#1D1616]">
                          ({stats?.total_jobs || 0} jobs)
                        </span>
                      </div>
                    </div>
                  </div>
                  {isOwnProfile && (
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSave}
                            className="px-6 py-3 rounded-2xl bg-[#D84040] text-white font-bold hover:bg-[#8E1616] transition-all shadow-lg hover:scale-105 border-2 border-[#D84040] flex items-center gap-2"
                          >
                            <CheckIcon className="h-5 w-5" />
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false)
                              fetchProfile() // Reset form
                            }}
                            className="px-6 py-3 rounded-2xl bg-[#EEEEEE] text-[#1D1616] font-bold hover:bg-[#1D1616] hover:text-white transition-all border-2 border-[#1D1616] flex items-center gap-2"
                          >
                            <XMarkIcon className="h-5 w-5" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-6 py-3 rounded-2xl bg-[#1D1616] text-white font-bold hover:bg-[#2A1F1F] transition-all shadow-lg hover:scale-105 border-2 border-[#1D1616] flex items-center gap-2"
                        >
                          <PencilIcon className="h-5 w-5" />
                          Edit Profile
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bio Card */}
            <div className="bg-white rounded-3xl shadow-card p-10 mb-8 border-2 border-[#1D1616]">
              <h2 className="text-3xl font-display font-bold text-[#1D1616] mb-6">About</h2>
              {isEditing ? (
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={6}
                  className="block w-full px-4 py-3 border-2 border-[#1D1616] rounded-2xl bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] text-[#1D1616] resize-none font-semibold"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-[#1D1616] leading-relaxed text-lg">
                  {profile.bio || 'No bio available.'}
                </p>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="bg-white rounded-3xl shadow-card p-8 border-2 border-[#1D1616]">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 bg-[#EEEEEE] rounded-2xl p-4 border-2 border-[#1D1616]">
                    <BriefcaseIcon className="h-8 w-8 text-[#D84040]" />
                  </div>
                </div>
                <p className="text-base font-semibold text-[#1D1616] mb-2">Jobs Posted</p>
                <p className="text-4xl font-display font-bold text-[#1D1616]">{stats?.jobs_posted || 0}</p>
              </div>

              <div className="bg-white rounded-3xl shadow-card p-8 border-2 border-[#1D1616]">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 bg-[#EEEEEE] rounded-2xl p-4 border-2 border-[#1D1616]">
                    <CheckBadgeIcon className="h-8 w-8 text-[#D84040]" />
                  </div>
                </div>
                <p className="text-base font-semibold text-[#1D1616] mb-2">Completed</p>
                <p className="text-4xl font-display font-bold text-[#1D1616]">{stats?.jobs_completed || 0}</p>
              </div>

              <div className="bg-white rounded-3xl shadow-card p-8 border-2 border-[#1D1616]">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 bg-[#EEEEEE] rounded-2xl p-4 border-2 border-[#1D1616]">
                    <StarIcon className="h-8 w-8 text-[#D84040]" />
                  </div>
                </div>
                <p className="text-base font-semibold text-[#1D1616] mb-2">Rating</p>
                <p className="text-4xl font-display font-bold text-[#1D1616]">
                  {profile.reputation_score.toFixed(1) || '0.0'}
                </p>
              </div>
            </div>

            {/* Skills Card */}
            <div className="bg-white rounded-3xl shadow-card p-10 border-2 border-[#1D1616]">
              <h2 className="text-3xl font-display font-bold text-[#1D1616] mb-6">Skills</h2>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSkill()
                        }
                      }}
                      className="flex-1 px-4 py-3 border-2 border-[#1D1616] rounded-2xl bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] text-[#1D1616] font-semibold"
                      placeholder="Add a skill and press Enter"
                    />
                    <button
                      onClick={addSkill}
                      className="px-6 py-3 rounded-2xl bg-[#D84040] text-white font-bold hover:bg-[#8E1616] transition-all border-2 border-[#D84040]"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editForm.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-[#EEEEEE] text-[#1D1616] border-2 border-[#1D1616]"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-2 hover:scale-110 transition-transform text-[#D84040]"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-6 py-3 rounded-2xl text-base font-bold bg-[#EEEEEE] text-[#1D1616] border-2 border-[#1D1616]"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-[#1D1616]">No skills added yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
