import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ScrollThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const shapesRef = useRef<THREE.Mesh[]>([])

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)

    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer

    // Create geometric shapes
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xD84040, // Exact palette vibrant red #D84040
      opacity: 0.1,
      transparent: true,
      wireframe: true
    })

    const count = 20
    const shapes: THREE.Mesh[] = []

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geometry, material.clone())
      mesh.position.x = (Math.random() - 0.5) * 30
      mesh.position.y = (Math.random() - 0.5) * 30
      mesh.position.z = (Math.random() - 0.5) * 30
      mesh.rotation.x = Math.random() * Math.PI
      mesh.rotation.y = Math.random() * Math.PI
      mesh.rotation.z = Math.random() * Math.PI
      const scale = 0.3 + Math.random() * 0.7
      mesh.scale.setScalar(scale)
      scene.add(mesh)
      shapes.push(mesh)
    }

    shapesRef.current = shapes
    camera.position.z = 8

    // Scroll handler
    let scrollY = 0
    const handleScroll = () => {
      scrollY = window.scrollY
    }
    window.addEventListener('scroll', handleScroll)

    // Animation
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const scrollProgress = scrollY / (document.documentElement.scrollHeight - window.innerHeight)

      shapes.forEach((shape, i) => {
        // Rotate based on scroll
        shape.rotation.x += 0.002 * (i % 2 === 0 ? 1 : -1) + scrollProgress * 0.01
        shape.rotation.y += 0.002 * (i % 3 === 0 ? 1 : -1) + scrollProgress * 0.01
        
        // Move based on scroll
        const baseY = (Math.random() - 0.5) * 30
        shape.position.y = baseY + scrollProgress * 10 * (i % 2 === 0 ? 1 : -1)
        
        // Scale based on scroll
        const baseScale = 0.3 + Math.random() * 0.7
        shape.scale.setScalar(baseScale + Math.sin(scrollProgress * Math.PI * 2 + i) * 0.2)
      })

      // Camera movement based on scroll
      camera.position.y = scrollProgress * 5
      camera.rotation.z = scrollProgress * 0.1

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      renderer.dispose()
      if (containerRef.current && renderer.domElement.parentNode) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none opacity-30"
      style={{ zIndex: 0 }}
    />
  )
}

