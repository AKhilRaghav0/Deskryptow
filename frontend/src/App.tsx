import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import PostJob from './pages/PostJob'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Search from './pages/Search'
import Notifications from './pages/Notifications'
import MyJobs from './pages/MyJobs'
import SavedJobs from './pages/SavedJobs'
import Chat from './pages/Chat'
import TestJobCreation from './pages/TestJobCreation'
import EscrowDashboard from './pages/EscrowDashboard'
import Transfer from './pages/Transfer'
import { useWallet } from './contexts/WalletContext'

function ProfileRedirect() {
  const { address } = useWallet()
  if (address) {
    return <Navigate to={`/profile/${address}`} replace />
  }
  return <Navigate to="/" replace />
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfileRedirect />} />
            <Route path="/profile/:address" element={<Profile />} />
            <Route path="/search" element={<Search />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/my-jobs" element={<MyJobs />} />
            <Route path="/saved-jobs" element={<SavedJobs />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:conversationId" element={<Chat />} />
            <Route path="/escrow" element={<EscrowDashboard />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/test-job-creation" element={<TestJobCreation />} />
      </Routes>
    </Layout>
  )
}

export default App
