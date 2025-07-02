import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Brain, Coins, TrendingUp, Shield, Zap, Globe } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description: 'Advanced machine learning algorithms analyze your spending patterns and provide personalized financial recommendations.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Coins,
    title: 'DeFi Integration',
    description: 'Seamlessly interact with decentralized finance protocols to maximize your returns while maintaining full control.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: TrendingUp,
    title: 'Smart Staking',
    description: 'Automated staking strategies that optimize your crypto holdings for maximum yield across multiple protocols.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    description: 'Military-grade encryption and multi-signature wallets ensure your assets are always protected.',
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: Zap,
    title: 'Lightning Speed',
    description: 'Execute trades and transactions at lightning speed with our optimized infrastructure and smart routing.',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Globe,
    title: 'Global Access',
    description: 'Access your financial ecosystem from anywhere in the world with full cross-border compatibility.',
    color: 'from-indigo-500 to-purple-500'
  }
]

export function WhyFinVerseSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-blue-500/20 rounded-full" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-purple-500/20 rounded-full" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-500/20 rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Why Choose{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              FinVerse
            </span>
            ?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're not just another fintech platform. We're building the future of finance
            with cutting-edge technology and user-centric design.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="relative group"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <div className="h-full p-8 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-border transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/10">
                {/* Icon with gradient background */}
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon size={32} className="text-white" />
                </div>

                <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-400 transition-colors duration-300">
                  {feature.title}
                </h3>

                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover effect overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to action */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <p className="text-lg text-muted-foreground">
            Ready to experience the future of finance?{' '}
            <span className="text-blue-400 font-semibold">Join thousands</span> of users already transforming their financial lives.
          </p>
        </motion.div>
      </div>
    </section>
  )
} 