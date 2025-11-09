import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'

interface CustomDropdownProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  className?: string
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  required = false,
  className = '',
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside and manage scroll lock
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY
      const scrollX = window.scrollX
      
      // Lock background scroll but allow dropdown to scroll
      const originalOverflow = document.body.style.overflow
      const originalPosition = document.body.style.position
      const originalTop = document.body.style.top
      const originalWidth = document.body.style.width
      
      // Lock scroll without jumping
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      
      // Also lock Lenis smooth scroll if available
      const lenisInstance = (window as any).__lenis
      if (lenisInstance && typeof lenisInstance.stop === 'function') {
        lenisInstance.stop()
      }
      document.documentElement.classList.add('lenis-stopped')
      document.body.classList.add('lenis-stopped')
      
      document.addEventListener('mousedown', handleClickOutside)

      return () => {
        // Restore background scroll and position
        document.body.style.overflow = originalOverflow
        document.body.style.position = originalPosition
        document.body.style.top = originalTop
        document.body.style.width = originalWidth
        
        // Restore scroll position
        window.scrollTo(scrollX, scrollY)
        
        if (lenisInstance && typeof lenisInstance.start === 'function') {
          lenisInstance.start()
        }
        document.documentElement.classList.remove('lenis-stopped')
        document.body.classList.remove('lenis-stopped')
        
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  const selectedOption = options.find(opt => opt === value) || placeholder

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-base font-bold text-[#1D1616] mb-4">
          {label} {required && <span className="text-[#D84040]">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`block w-full px-6 py-4 border-2 border-[#1D1616] rounded-2xl bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] focus:border-transparent text-[#1D1616] font-semibold text-lg text-left flex items-center justify-between ${
            !value ? 'text-[#8E1616]' : ''
          }`}
        >
          <span>{selectedOption}</span>
          <ChevronDownIcon
            className={`h-5 w-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div 
            className="absolute z-50 w-full mt-2 bg-white rounded-2xl border-2 border-[#1D1616] shadow-2xl max-h-60 overflow-y-auto custom-dropdown" 
            style={{ 
              scrollbarWidth: 'thin', 
              scrollbarColor: '#1D1616 #EEEEEE',
              overscrollBehavior: 'contain'
            }}
            onWheel={(e) => {
              // Allow scrolling within dropdown
              e.stopPropagation()
            }}
            onTouchMove={(e) => {
              // Allow touch scrolling within dropdown
              e.stopPropagation()
            }}
          >
            <style>{`
              .custom-dropdown::-webkit-scrollbar {
                width: 8px;
              }
              .custom-dropdown::-webkit-scrollbar-track {
                background: #EEEEEE;
                border-radius: 4px;
              }
              .custom-dropdown::-webkit-scrollbar-thumb {
                background: #1D1616;
                border-radius: 4px;
              }
              .custom-dropdown::-webkit-scrollbar-thumb:hover {
                background: #2A1F1F;
              }
            `}</style>
            <div>
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option)
                  setIsOpen(false)
                }}
                className={`w-full px-6 py-4 text-left flex items-center justify-between hover:bg-[#EEEEEE] transition-all ${
                  value === option
                    ? 'bg-[#EEEEEE] text-[#1D1616] font-bold'
                    : 'text-[#1D1616]'
                } ${
                  options.indexOf(option) !== options.length - 1
                    ? 'border-b-2 border-[#1D1616]'
                    : ''
                }`}
              >
                <span>{option}</span>
                {value === option && (
                  <CheckIcon className="h-5 w-5 text-[#D84040]" />
                )}
              </button>
            ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

