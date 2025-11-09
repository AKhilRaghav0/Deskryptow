import { useState, useEffect } from 'react'
import { XMarkIcon, PaperClipIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface SubmitWorkModalProps {
  jobId: string
  jobTitle: string
  isOpen: boolean
  onClose: () => void
  onSubmit: (description: string, files: File[]) => Promise<void>
  isSubmitting: boolean
}

export default function SubmitWorkModal({
  jobId,
  jobTitle,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: SubmitWorkModalProps) {
  const [description, setDescription] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      document.body.classList.add('modal-open')
      
      const lenisInstance = (window as any).__lenis
      if (lenisInstance && typeof lenisInstance.stop === 'function') {
        lenisInstance.stop()
      }
      document.documentElement.classList.add('lenis-stopped')
      document.body.classList.add('lenis-stopped')

      return () => {
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
    if (e.target) e.target.value = ''
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!description.trim() && selectedFiles.length === 0) {
      toast.error('Please provide a description or upload files')
      return
    }

    await onSubmit(description, selectedFiles)
    setDescription('')
    setSelectedFiles([])
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border-4 border-[#1D1616] w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex-shrink-0 bg-white border-b-4 border-[#1D1616] p-6 flex items-center justify-between">
          <h2 className="text-3xl font-display font-bold text-[#1D1616]">Submit Work</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl hover:bg-[#EEEEEE] transition-all border-2 border-[#1D1616] disabled:opacity-50"
          >
            <XMarkIcon className="h-6 w-6 text-[#1D1616]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
          <div>
            <label className="block text-base font-bold text-[#1D1616] mb-3">
              Job: {jobTitle}
            </label>
          </div>

          <div>
            <label htmlFor="description" className="block text-base font-bold text-[#1D1616] mb-3">
              Work Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={12}
              className="w-full px-4 py-3 border-2 border-[#1D1616] rounded-2xl bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] focus:border-transparent text-[#1D1616] font-semibold resize-none"
              placeholder="Describe the work you've completed, include links, notes, or any important information..."
            />
          </div>

          <div>
            <label className="block text-base font-bold text-[#1D1616] mb-3">
              Attach Files (Optional)
            </label>
            <div className="border-2 border-dashed border-[#1D1616] rounded-2xl p-6 text-center">
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={isSubmitting}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-[#EEEEEE] rounded-xl border-2 border-[#1D1616] hover:bg-[#E5E5E5] transition-all font-bold text-[#1D1616] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperClipIcon className="h-5 w-5" />
                Choose Files
              </label>
              <p className="text-sm text-[#1D1616] mt-2 opacity-75">
                Files will be uploaded to IPFS
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-[#EEEEEE] rounded-xl border-2 border-[#1D1616]"
                  >
                    <div className="flex items-center gap-3">
                      <PaperClipIcon className="h-5 w-5 text-[#1D1616]" />
                      <div>
                        <p className="font-semibold text-[#1D1616]">{file.name}</p>
                        <p className="text-xs text-[#1D1616] opacity-75">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      disabled={isSubmitting}
                      className="p-1 rounded-lg hover:bg-red-100 transition-all text-red-600 disabled:opacity-50"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 flex gap-3 pt-4 border-t-4 border-[#1D1616]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 rounded-2xl text-base font-bold text-[#1D1616] bg-[#EEEEEE] hover:bg-[#E5E5E5] transition-all border-2 border-[#1D1616] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!description.trim() && selectedFiles.length === 0)}
              className="flex-1 px-6 py-4 rounded-2xl text-base font-bold text-white bg-[#D84040] hover:bg-[#8E1616] transition-all border-2 border-[#D84040] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Work'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

