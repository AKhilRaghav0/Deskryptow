import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { 
  ShieldCheckIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  GlobeAltIcon, 
  ArrowRightIcon, 
  SparklesIcon, 
  CheckCircleIcon,
  BoltIcon,
  RocketLaunchIcon,
  FireIcon,
  StarIcon
} from '@heroicons/react/24/solid'
import ScrollThreeBackground from '../components/ScrollThreeBackground'
import ScrollLock from '../components/ScrollLock'

export default function Home() {
  const [isLocked, setIsLocked] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        setIsLocked(rect.top > -100 && rect.top < window.innerHeight)
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      name: 'Secure Escrow',
      description: 'Smart contracts hold funds safely until work is approved',
      icon: ShieldCheckIcon,
      color: 'bg-primary-500 text-white',
      bgColor: 'bg-red-50',
    },
    {
      name: 'Low Fees',
      description: 'Only 2% platform fee vs 20% on traditional platforms',
      icon: CurrencyDollarIcon,
      color: 'bg-primary-600 text-white',
      bgColor: 'bg-red-100',
    },
    {
      name: 'Instant Payments',
      description: 'Get paid immediately upon work approval',
      icon: ClockIcon,
      color: 'bg-primary-500 text-white',
      bgColor: 'bg-red-50',
    },
    {
      name: 'Global Access',
      description: 'Work from anywhere, no bank account required',
      icon: GlobeAltIcon,
      color: 'bg-primary-600 text-white',
      bgColor: 'bg-red-100',
    },
  ]

  const stats = [
    { value: '10K+', label: 'Active Users', sublabel: 'Growing daily', icon: StarIcon, color: 'text-primary-500' },
    { value: '5K+', label: 'Jobs Posted', sublabel: 'This month', icon: RocketLaunchIcon, color: 'text-primary-600' },
    { value: '98%', label: 'Success Rate', sublabel: 'Completed jobs', icon: FireIcon, color: 'text-primary-500' },
    { value: '24/7', label: 'Support', sublabel: 'Always available', icon: BoltIcon, color: 'text-primary-600' },
  ]

  const benefits = [
    'No middleman fees',
    'Instant payment release',
    'Global accessibility',
    'Smart contract security',
    'Dispute resolution',
    'Transparent transactions',
  ]

  return (
    <div className="relative w-full overflow-hidden">
      <ScrollLock lock={isLocked} />
      <ScrollThreeBackground />
      
      {/* Hero Section - Full Width */}
      <section ref={heroRef} className="relative overflow-hidden w-full min-h-screen flex items-center">
        {/* Animated Background Blur Layers */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-32 sm:py-40 relative z-10">
          <div className="max-w-4xl">
            <div data-lenis-prevent>
              {/* Badge with high contrast */}
              <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#1D1616] text-white text-sm font-bold mb-8 shadow-xl animate-fade-in border-2 border-[#1D1616]">
                <SparklesIcon className="h-4 w-4 mr-2.5 text-[#D84040]" />
                Decentralized Escrow Platform
              </div>
              
              {/* Main Heading - NO BOUNCE EFFECT */}
              <h1 className="text-6xl sm:text-7xl md:text-8xl font-display font-bold text-[#1D1616] tracking-tight mb-8 leading-[1.1] animate-fade-in-up">
                Create stunning
                <br />
                <span className="text-[#D84040] relative inline-block">
                  freelance work.
                </span>
              </h1>
              
              {/* Description with better contrast */}
              <p className="text-2xl text-[#1D1616] mb-12 leading-relaxed max-w-3xl font-medium">
                Decentralized escrow platform powered by smart contracts. Trustless payments, instant settlements, global access.
              </p>
              
              {/* CTA Buttons with improved contrast - Uber Black Style */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  to="/jobs"
                  className="group inline-flex items-center justify-center px-10 py-5 rounded-2xl text-lg font-bold text-white bg-[#1D1616] hover:bg-[#2A1F1F] transition-all shadow-2xl hover:scale-105 border-2 border-[#1D1616]"
                >
                  Browse Jobs
                  <ArrowRightIcon className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/post-job"
                  className="group inline-flex items-center justify-center px-10 py-5 rounded-2xl text-lg font-bold text-[#1D1616] bg-white hover:bg-[#EEEEEE] transition-all border-2 border-[#1D1616] shadow-xl hover:scale-105"
                >
                  Post a Job
                  <RocketLaunchIcon className="ml-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
                </Link>
              </div>
              
              {/* Benefits with better contrast */}
              <div className="flex flex-wrap gap-6 bg-white p-6 rounded-3xl border-2 border-[#1D1616] shadow-xl">
                {benefits.slice(0, 3).map((benefit, index) => (
                  <div key={index} className="flex items-center text-[#1D1616] group">
                    <CheckCircleIcon className="h-5 w-5 text-[#D84040] mr-2 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Full Width with Proper Colors */}
      <section ref={statsRef} className="relative w-full py-20 bg-white border-y-2 border-mono-200">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center group bg-white p-8 rounded-3xl border-2 border-mono-200 shadow-xl hover:scale-105 transition-all hover:border-primary-500">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-mono-100 mb-4 group-hover:scale-110 transition-transform border-2 border-mono-200">
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                  <div className="text-5xl md:text-6xl font-display font-bold text-[#1D1616] mb-3 group-hover:text-[#D84040] transition-colors">{stat.value}</div>
                  <div className="text-base font-bold text-[#1D1616] mb-1">{stat.label}</div>
                  <div className="text-sm text-[#8E1616]">{stat.sublabel}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section - Full Width with Color Segmentation */}
      <section ref={featuresRef} className="relative w-full py-32 bg-mono-50">
        {/* Background blur elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl sm:text-6xl font-display font-bold text-[#1D1616] mb-6">
              Why choose Deskryptow?
            </h2>
            <p className="text-xl text-[#1D1616] max-w-3xl mx-auto leading-relaxed font-medium">
              Built for the future of freelance work with cutting-edge blockchain technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.name}
                  className={`${feature.bgColor} rounded-3xl p-10 hover:shadow-2xl transition-all border-2 border-white group hover:scale-105 animate-fade-in-up`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-xl`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-[#1D1616] mb-4">
                    {feature.name}
                  </h3>
                  <p className="text-[#1D1616] leading-relaxed text-base">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Grid - Full Width */}
      <section className="relative w-full py-32 bg-white">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl sm:text-6xl font-display font-bold text-[#1D1616] mb-8">
                Everything you need
                <br />
                <span className="text-[#D84040]">in one platform</span>
              </h2>
              <p className="text-xl text-[#1D1616] mb-12 leading-relaxed font-medium">
                Our platform combines the best of traditional freelancing with the power of blockchain technology.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center p-4 rounded-2xl bg-[#EEEEEE] border-2 border-[#1D1616] hover:bg-white hover:shadow-xl transition-all group">
                    <CheckCircleIcon className="h-6 w-6 text-[#D84040] mr-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-[#1D1616]">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-mono-50 rounded-3xl p-12 border-2 border-mono-200 shadow-2xl">
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-mono-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-[#1D1616]">Total Volume</span>
                      <span className="text-2xl font-display font-bold text-[#D84040]">1,234 MATIC</span>
                    </div>
                    <div className="h-2 bg-mono-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full w-3/4 transition-all"></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-mono-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-[#1D1616]">Active Jobs</span>
                      <span className="text-2xl font-display font-bold text-[#1D1616]">5,234</span>
                    </div>
                    <div className="h-2 bg-[#EEEEEE] rounded-full overflow-hidden">
                      <div className="h-full bg-[#8E1616] rounded-full w-4/5 transition-all"></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-[#1D1616]">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-[#1D1616]">Success Rate</span>
                      <span className="text-2xl font-display font-bold text-[#1D1616]">98%</span>
                    </div>
                    <div className="h-2 bg-[#EEEEEE] rounded-full overflow-hidden">
                      <div className="h-full bg-[#D84040] rounded-full w-full transition-all"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Full Width */}
      <section className="relative w-full py-32 bg-mono-50 border-t-2 border-mono-200">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-5xl mx-auto text-center">
            <div className="bg-white rounded-3xl p-16 border-2 border-mono-200 shadow-2xl">
              <h2 className="text-5xl sm:text-6xl font-display font-bold text-[#1D1616] mb-6">
                Ready to get started?
              </h2>
              <p className="text-xl text-[#1D1616] mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                Join thousands of freelancers and clients using blockchain-powered escrow for secure, instant payments
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/jobs"
                  className="group inline-flex items-center justify-center px-10 py-5 rounded-2xl text-lg font-bold text-white bg-[#1D1616] hover:bg-[#2A1F1F] transition-all shadow-2xl hover:scale-105 border-2 border-[#1D1616]"
                >
                  Explore Jobs
                  <ArrowRightIcon className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/post-job"
                  className="group inline-flex items-center justify-center px-10 py-5 rounded-2xl text-lg font-bold text-[#1D1616] bg-white hover:bg-[#EEEEEE] transition-all border-2 border-[#1D1616] shadow-xl hover:scale-105"
                >
                  Post a Job
                  <RocketLaunchIcon className="ml-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
