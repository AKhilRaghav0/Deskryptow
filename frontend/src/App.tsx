import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import PostJob from './pages/PostJob'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile/:address" element={<Profile />} />
      </Routes>
    </Layout>
  )
}

export default App
