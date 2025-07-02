import { motion } from 'framer-motion'
import { ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export function HeroSection() {
  const navigate = useNavigate()

  const handleGetStarted = () => {
    navigate('/register')
  }

  const handleConnectWallet = () => {
    navigate('/staking/login')
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 40% 40%, rgba(120, 200, 255, 0.3) 0%, transparent 50%)`
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto text-center">
        {/* Floating icons */}
        <motion.div
          className="absolute -top-10 -left-10 text-blue-500"
          animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Zap size={40} />
        </motion.div>
        <motion.div
          className="absolute -top-5 -right-15 text-purple-500"
          animate={{ y: [10, -15, 10], rotate: [0, -8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <Shield size={35} />
        </motion.div>
        <motion.div
          className="absolute -bottom-5 left-10 text-cyan-500"
          animate={{ y: [-8, 12, -8], rotate: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        >
          <TrendingUp size={30} />
        </motion.div>

        {/* Main hero content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold mb-8 leading-tight">
            <span className="block text-foreground mb-2">The Future of</span>
            <span className="block bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent text-gradient-animated">
              Personal Finance
            </span>
          </h1>
        </motion.div>

        <motion.p
          className="text-xl sm:text-2xl lg:text-3xl text-muted-foreground max-w-4xl mx-auto mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          Harness the power of <span className="text-blue-400 font-semibold">AI</span> and{' '}
          <span className="text-purple-400 font-semibold">DeFi</span> to revolutionize how you manage,
          grow, and secure your financial future.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <Button
            size="lg"
            className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            onClick={handleGetStarted}
          >
            Get Started
            <ArrowRight className="ml-2" size={20} />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="text-lg px-8 py-6 border-2 border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/10 transform hover:scale-105 transition-all duration-300"
            onClick={handleConnectWallet}
          >
            Connect Wallet
          </Button>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          className="mt-16 flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-green-500" />
            <span>Bank-level Security</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-yellow-500" />
            <span>Lightning Fast</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" />
            <span>Maximize Returns</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 