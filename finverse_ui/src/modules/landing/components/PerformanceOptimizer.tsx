import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'

// Lazy load components for better performance
const HeroSection = lazy(() => import('./HeroSection').then(module => ({ default: module.HeroSection })))
const WhyFinVerseSection = lazy(() => import('./WhyFinVerseSection').then(module => ({ default: module.WhyFinVerseSection })))
const LiveDeFiStats = lazy(() => import('./LiveDeFiStats').then(module => ({ default: module.LiveDeFiStats })))
const InteractiveDemo = lazy(() => import('./InteractiveDemo').then(module => ({ default: module.InteractiveDemo })))
const LandingFooter = lazy(() => import('./LandingFooter').then(module => ({ default: module.LandingFooter })))

// Loading skeleton component
const SectionSkeleton = ({ height = "min-h-screen" }: { height?: string }) => (
  <div className={`${height} flex items-center justify-center bg-background/50 backdrop-blur-sm`}>
    <motion.div
      className="text-center space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-16 h-16 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground">Loading...</p>
    </motion.div>
  </div>
)

export function OptimizedLandingPage() {
  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-background via-background to-slate-900 dark:to-slate-950 overflow-x-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-64 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -left-64 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Main content with optimized loading */}
      <div className="relative z-10">
        <Suspense fallback={<SectionSkeleton />}>
          <HeroSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton height="min-h-[80vh]" />}>
          <WhyFinVerseSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton height="min-h-[60vh]" />}>
          <LiveDeFiStats />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton height="min-h-[70vh]" />}>
          <InteractiveDemo />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton height="min-h-[40vh]" />}>
          <LandingFooter />
        </Suspense>
      </div>
    </motion.div>
  )
} 