import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Play, PieChart, Wallet, TrendingUp, Shield, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

const demoFeatures = [
  {
    id: 'dashboard',
    icon: PieChart,
    title: 'Smart Dashboard',
    description: 'View all your financial metrics in one beautiful, intelligent dashboard.',
    preview: 'Experience AI-powered insights and real-time portfolio tracking.'
  },
  {
    id: 'staking',
    icon: Wallet,
    title: 'DeFi Staking',
    description: 'Stake your crypto assets with optimized strategies for maximum returns.',
    preview: 'Explore our automated staking pools and yield farming opportunities.'
  },
  {
    id: 'analytics',
    icon: TrendingUp,
    title: 'Advanced Analytics',
    description: 'Deep dive into your financial patterns with ML-powered analysis.',
    preview: 'Discover spending insights and personalized financial recommendations.'
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Security Center',
    description: 'Monitor and manage your account security with enterprise-grade tools.',
    preview: 'See how we protect your assets with multi-layer security protocols.'
  }
]

export function InteractiveDemo() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const navigate = useNavigate()
  const [selectedFeature, setSelectedFeature] = useState('dashboard')

  const handleLiveDemo = () => {
    navigate('/register')
  }

  const handleWatchDemo = () => {
    // In a real implementation, this could open a video modal or navigate to a demo video
    navigate('/login')
  }

  return (
    <section ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            See FinVerse in{' '}
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              Action
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Don't just take our word for it. Experience the power of FinVerse with an interactive preview
            of our most popular features.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Feature selector */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {demoFeatures.map((feature, index) => (
              <motion.div
                key={feature.id}
                className={`p-6 rounded-xl border cursor-pointer transition-all duration-300 ${
                  selectedFeature === feature.id
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                    : 'border-border/50 hover:border-border hover:bg-card/50'
                }`}
                onClick={() => setSelectedFeature(feature.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.8, delay: 0.1 * index }}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    selectedFeature === feature.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  } transition-colors duration-300`}>
                    <feature.icon size={24} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 ${
                      selectedFeature === feature.id ? 'text-blue-400' : 'text-foreground'
                    }`}>
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      {feature.description}
                    </p>
                    {selectedFeature === feature.id && (
                      <motion.p
                        className="text-blue-400 text-sm font-medium"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                      >
                        {feature.preview}
                      </motion.p>
                    )}
                  </div>

                  <ChevronRight
                    size={20}
                    className={`transition-transform duration-300 ${
                      selectedFeature === feature.id ? 'rotate-90 text-blue-400' : 'text-muted-foreground'
                    }`}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Demo preview */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm rounded-2xl p-8 border border-border/50 shadow-xl">
              {/* Mock interface preview */}
              <div className="aspect-video bg-gradient-to-br from-background to-background/80 rounded-lg border border-border/30 overflow-hidden">
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <motion.div
                      className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center"
                      animate={{ rotate: [0, 5, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                                           {(() => {
                       const feature = demoFeatures.find(f => f.id === selectedFeature);
                       if (feature?.icon) {
                         const IconComponent = feature.icon;
                         return <IconComponent size={40} className="text-white" />;
                       }
                       return null;
                     })()}
                    </motion.div>
                    <h4 className="text-xl font-semibold mb-2">
                      {demoFeatures.find(f => f.id === selectedFeature)?.title}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      Interactive preview coming soon
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button
                  onClick={handleLiveDemo}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Play size={16} className="mr-2" />
                  Try Live Demo
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleWatchDemo}
                  className="flex-1 border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/10"
                >
                  Watch Video Demo
                </Button>
              </div>
            </div>

            {/* Floating elements */}
            <motion.div
              className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-20 blur-xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full opacity-20 blur-xl"
              animate={{ scale: [1.2, 1, 1.2] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
} 