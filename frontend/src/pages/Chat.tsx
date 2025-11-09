import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ChatBubbleLeftRightIcon, 
  PaperClipIcon, 
  PhotoIcon,
  XMarkIcon,
  ArrowLeftIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { useWallet } from '../contexts/WalletContext'
import { config } from '../config'
import axios from 'axios'
import toast from 'react-hot-toast'

interface Conversation {
  id: string
  participant1_address: string
  participant2_address: string
  participant1_username?: string
  participant2_username?: string
  job_id?: string
  job_title?: string
  last_message_at: string
  last_message_preview?: string
  unread_count: number
  created_at: string
}

interface MessageAttachment {
  id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  created_at: string
}

interface Message {
  id: string
  conversation_id: string
  sender_address: string
  sender_username?: string
  content?: string
  message_type: string
  is_read: boolean
  created_at: string
  attachments: MessageAttachment[]
}

export default function Chat() {
  const { conversationId } = useParams<{ conversationId?: string }>()
  const { address, isConnected } = useWallet()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isConnected && address) {
      fetchConversations()
    }
    
    // Lock scroll when chat is open
    document.body.style.overflow = 'hidden'
    document.body.classList.add('chat-open')
    
    // Also lock Lenis smooth scroll if available
    const lenisInstance = (window as any).__lenis
    if (lenisInstance && typeof lenisInstance.stop === 'function') {
      lenisInstance.stop()
    }
    document.documentElement.classList.add('lenis-stopped')
    document.body.classList.add('lenis-stopped')
    
    return () => {
      // Cleanup: restore scroll
      document.body.style.overflow = ''
      document.body.classList.remove('chat-open')
      if (lenisInstance && typeof lenisInstance.start === 'function') {
        lenisInstance.start()
      }
      document.documentElement.classList.remove('lenis-stopped')
      document.body.classList.remove('lenis-stopped')
    }
  }, [isConnected, address])

  useEffect(() => {
    if (conversationId) {
      const conv = conversations.find(c => c.id === conversationId)
      if (conv) {
        setSelectedConversation(conv)
        fetchMessages(conv.id)
      }
    }
  }, [conversationId, conversations])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Poll for new messages every 3 seconds
    if (selectedConversation) {
      const interval = setInterval(() => {
        fetchMessages(selectedConversation.id, false) // Silent fetch
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    if (!isConnected || !address) return
    
    try {
      setLoading(true)
      const response = await axios.get(
        `${config.apiUrl}/api/v1/chat/conversations`,
        { params: { user_address: address } }
      )
      setConversations(response.data)
      
      // If conversationId is in URL, select it
      if (conversationId) {
        const conv = response.data.find((c: Conversation) => c.id === conversationId)
        if (conv) {
          setSelectedConversation(conv)
          fetchMessages(conv.id)
        }
      }
    } catch (error: any) {
      console.error('Error fetching conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (convId: string, showLoading = true) => {
    if (!isConnected || !address) return
    
    try {
      if (showLoading) setLoading(true)
      const response = await axios.get(
        `${config.apiUrl}/api/v1/chat/conversations/${convId}/messages`,
        { params: { user_address: address, limit: 100 } }
      )
      setMessages(response.data)
    } catch (error: any) {
      console.error('Error fetching messages:', error)
      if (showLoading) toast.error('Failed to load messages')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const files = Array.from(e.target.files || [])
    if (isImage) {
      const imageFiles = files.filter(f => f.type.startsWith('image/'))
      setSelectedFiles(prev => [...prev, ...imageFiles])
    } else {
      setSelectedFiles(prev => [...prev, ...files])
    }
    // Reset input
    if (e.target) e.target.value = ''
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const sendMessage = async () => {
    if (!selectedConversation || !isConnected || !address) return
    if (!messageInput.trim() && selectedFiles.length === 0) return

    setSending(true)
    try {
      const formData = new FormData()
      formData.append('conversation_id', selectedConversation.id)
      formData.append('sender_address', address)
      if (messageInput.trim()) {
        formData.append('content', messageInput.trim())
      }
      
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })

      await axios.post(
        `${config.apiUrl}/api/v1/chat/messages`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      setMessageInput('')
      setSelectedFiles([])
      fetchMessages(selectedConversation.id, false)
      fetchConversations() // Refresh conversation list
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getOtherParticipant = (conversation: Conversation) => {
    if (conversation.participant1_address.toLowerCase() === address?.toLowerCase()) {
      return {
        address: conversation.participant2_address,
        username: conversation.participant2_username || conversation.participant2_address.slice(0, 6) + '...' + conversation.participant2_address.slice(-4)
      }
    }
    return {
      address: conversation.participant1_address,
      username: conversation.participant1_username || conversation.participant1_address.slice(0, 6) + '...' + conversation.participant1_address.slice(-4)
    }
  }

  if (!isConnected) {
    return (
      <div className="w-full flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto px-6">
          <ChatBubbleLeftRightIcon className="h-16 w-16 text-[#1D1616] mx-auto mb-6" />
          <h2 className="text-3xl font-display font-bold text-[#1D1616] mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-lg text-[#1D1616]">
            Please connect your MetaMask wallet to use chat.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 w-full h-screen flex z-50 bg-white">
      {/* Conversations List */}
      <div className="w-full md:w-96 border-r-2 border-[#1D1616] bg-white flex flex-col">
        <div className="p-6 border-b-2 border-[#1D1616]">
          <h2 className="text-2xl font-display font-bold text-[#1D1616]">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading && conversations.length === 0 ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#1D1616] border-t-transparent"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-[#1D1616] mx-auto mb-4 opacity-50" />
              <p className="text-[#1D1616]">No conversations yet</p>
            </div>
          ) : (
            <div className="divide-y-2 divide-[#1D1616]">
              {conversations.map((conv) => {
                const other = getOtherParticipant(conv)
                const isSelected = selectedConversation?.id === conv.id
                return (
                  <Link
                    key={conv.id}
                    to={`/chat/${conv.id}`}
                    className={`block p-4 hover:bg-[#EEEEEE] transition-all ${
                      isSelected ? 'bg-[#EEEEEE] border-l-4 border-[#D84040]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#1D1616] flex items-center justify-center text-white font-bold flex-shrink-0">
                        {other.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-[#1D1616] truncate">{other.username}</p>
                          {conv.unread_count > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#D84040] text-white">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        {conv.job_title && (
                          <p className="text-xs text-[#8E1616] mb-1 truncate">{conv.job_title}</p>
                        )}
                        {conv.last_message_preview && (
                          <p className="text-sm text-[#1D1616] truncate">{conv.last_message_preview}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-[#EEEEEE]">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b-2 border-[#1D1616] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  to="/chat"
                  className="md:hidden p-2 rounded-xl hover:bg-[#EEEEEE] transition-all"
                >
                  <ArrowLeftIcon className="h-6 w-6 text-[#1D1616]" />
                </Link>
                {(() => {
                  const other = getOtherParticipant(selectedConversation)
                  return (
                    <>
                      <div className="w-10 h-10 rounded-full bg-[#1D1616] flex items-center justify-center text-white font-bold">
                        {other.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-[#1D1616]">{other.username}</p>
                        {selectedConversation.job_title && (
                          <p className="text-xs text-[#8E1616]">{selectedConversation.job_title}</p>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>
              {selectedConversation.job_id && (
                <Link
                  to={`/jobs/${selectedConversation.job_id}`}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#1D1616] hover:bg-[#2A1F1F] transition-all"
                >
                  View Job
                </Link>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {loading && messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#1D1616] border-t-transparent"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-[#1D1616] mx-auto mb-4 opacity-50" />
                  <p className="text-[#1D1616]">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_address.toLowerCase() === address?.toLowerCase()
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                        {!isOwn && (
                          <p className="text-xs text-[#8E1616] mb-1 ml-2">
                            {msg.sender_username || msg.sender_address.slice(0, 6) + '...' + msg.sender_address.slice(-4)}
                          </p>
                        )}
                        <div
                          className={`rounded-2xl p-4 ${
                            isOwn
                              ? 'bg-[#D84040] text-white'
                              : 'bg-white text-[#1D1616] border-2 border-[#1D1616]'
                          }`}
                        >
                          {msg.content && (
                            <p className="mb-2 whitespace-pre-wrap break-words">{msg.content}</p>
                          )}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="space-y-2">
                              {msg.attachments.map((att) => (
                                <div key={att.id}>
                                  {att.file_type.startsWith('image/') ? (
                                    <img
                                      src={`${config.apiUrl}${att.file_url}`}
                                      alt={att.file_name}
                                      className="max-w-full rounded-xl border-2 border-[#1D1616]"
                                    />
                                  ) : (
                                    <a
                                      href={`${config.apiUrl}${att.file_url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${
                                        isOwn
                                          ? 'bg-white/20 text-white border-white'
                                          : 'bg-[#EEEEEE] text-[#1D1616] border-[#1D1616]'
                                      }`}
                                    >
                                      <PaperClipIcon className="h-5 w-5" />
                                      <span className="font-semibold">{att.file_name}</span>
                                      <span className="text-xs">({formatFileSize(att.file_size)})</span>
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-xs mt-2 opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t-2 border-[#1D1616] p-4">
              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#EEEEEE] border-2 border-[#1D1616]"
                    >
                      {file.type.startsWith('image/') ? (
                        <PhotoIcon className="h-5 w-5 text-[#D84040]" />
                      ) : (
                        <PaperClipIcon className="h-5 w-5 text-[#1D1616]" />
                      )}
                      <span className="text-sm font-semibold text-[#1D1616] max-w-[150px] truncate">
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 rounded-full hover:bg-[#D84040] hover:text-white transition-all"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, false)}
                  accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, true)}
                  accept="image/*"
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="p-3 rounded-xl bg-[#EEEEEE] text-[#1D1616] hover:bg-[#E5E5E5] transition-all border-2 border-[#1D1616]"
                  title="Send photo"
                >
                  <PhotoIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-xl bg-[#EEEEEE] text-[#1D1616] hover:bg-[#E5E5E5] transition-all border-2 border-[#1D1616]"
                  title="Send file"
                >
                  <PaperClipIcon className="h-5 w-5" />
                </button>
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-[#1D1616] bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] resize-none text-[#1D1616] font-semibold"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || (!messageInput.trim() && selectedFiles.length === 0)}
                  className="px-6 py-3 rounded-xl text-white bg-[#D84040] hover:bg-[#8E1616] transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#D84040]"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="h-16 w-16 text-[#1D1616] mx-auto mb-6 opacity-50" />
              <h3 className="text-2xl font-display font-bold text-[#1D1616] mb-2">
                Select a conversation
              </h3>
              <p className="text-[#1D1616]">
                Choose a conversation from the list to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

