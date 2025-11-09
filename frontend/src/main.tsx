import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { Toaster } from 'react-hot-toast'
import SmoothScroll from './components/SmoothScroll'
import { WalletProvider } from './contexts/WalletContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <WalletProvider>
        <SmoothScroll>
          <App />
          <Toaster position="top-right" />
        </SmoothScroll>
      </WalletProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
