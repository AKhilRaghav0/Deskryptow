import { useEffect, useRef } from 'react'
import { 
  SparklesIcon, 
  BoltIcon, 
  RocketLaunchIcon,
  FireIcon,
  StarIcon,
  HeartIcon
} from '@heroicons/react/24/solid'

const icons = [
  { Icon: SparklesIcon, color: 'text-primary-600' },
  { Icon: BoltIcon, color: 'text-yellow-500' },
  { Icon: RocketLaunchIcon, color: 'text-purple-600' },
  { Icon: FireIcon, color: 'text-orange-500' },
  { Icon: StarIcon, color: 'text-blue-500' },
  { Icon: HeartIcon, color: 'text-pink-500' },
]

export default function FloatingIcons() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const createFloatingIcon = () => {
      const iconData = icons[Math.floor(Math.random() * icons.length)]
      const icon = document.createElement('div')
      icon.className = `absolute ${iconData.color} opacity-20`
      icon.style.left = `${Math.random() * 100}%`
      icon.style.top = `${Math.random() * 100}%`
      icon.style.transform = `scale(${0.5 + Math.random() * 0.5})`
      
      const IconComponent = iconData.Icon
      // We'll use a simple approach with innerHTML for now
      icon.innerHTML = `<svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`
      
      container.appendChild(icon)

      // Animate
      const duration = 3000 + Math.random() * 2000
      const startY = parseFloat(icon.style.top)
      
      const animate = () => {
        const progress = Date.now() % duration / duration
        icon.style.top = `${startY + Math.sin(progress * Math.PI * 2) * 50}%`
        icon.style.transform = `scale(${0.5 + Math.random() * 0.5}) rotate(${progress * 360}deg)`
      }

      const interval = setInterval(animate, 50)

      // Remove after animation
      setTimeout(() => {
        clearInterval(interval)
        icon.remove()
      }, duration * 2)
    }

    // Create icons periodically
    const interval = setInterval(createFloatingIcon, 2000)
    createFloatingIcon() // Initial icon

    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
    />
  )
}

