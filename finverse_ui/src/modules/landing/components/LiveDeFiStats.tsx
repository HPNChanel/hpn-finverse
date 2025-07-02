import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useRef, useEffect } from 'react'
import { TrendingUp, DollarSign, Users, Zap } from 'lucide-react'

function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { duration: duration * 1000 })
  const rounded = useTransform(springValue, (latest) => Math.round(latest))

  useEffect(() => {
    if (isInView) {
      motionValue.set(value)
    }
  }, [isInView, motionValue, value])

  return <motion.span ref={ref}>{rounded}</motion.span>
}

const stats = [
  {
    icon: DollarSign,
    label: 'Total Value Locked',
    value: 2840000,
    suffix: 'M',
    prefix: '$',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: TrendingUp,
    label: 'Current APY',
    value: 18.5,
    suffix: '%',
    prefix: '',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Users,
    label: 'Active Stakers',
    value: 156000,
    suffix: '+',
    prefix: '',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Zap,
    label: 'Rewards Distributed',
    value: 45.2,
    suffix: 'M',
    prefix: '$',
    color: 'from-orange-500 to-red-500'
  }
]

export function LiveDeFiStats() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Live{' '}
            <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              DeFi Stats
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real-time insights into our thriving DeFi ecosystem. Watch your investments grow
            with transparent, community-driven protocols.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="relative group"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <div className="p-8 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-border transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/10 text-center">
                {/* Animated icon */}
                <motion.div
                  className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${stat.color} mb-6 group-hover:scale-110 transition-transform duration-300`}
                  whileHover={{ rotate: 5 }}
                >
                  <stat.icon size={32} className="text-white" />
                </motion.div>

                {/* Animated counter */}
                <div className="mb-4">
                  <span className="text-4xl sm:text-5xl font-bold text-foreground">
                    {stat.prefix}
                    <AnimatedCounter value={stat.value} />
                    {stat.suffix}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  {stat.label}
                </h3>

                {/* Pulse animation for live data indicator */}
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-green-500 font-medium">LIVE</span>
                  </div>
                </div>

                {/* Hover gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional insights */}
        <motion.div
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="text-center p-6 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <h4 className="text-lg font-semibold mb-2 text-blue-400">24h Volume</h4>
            <p className="text-2xl font-bold">$<AnimatedCounter value={892} />M</p>
          </div>
          
          <div className="text-center p-6 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <h4 className="text-lg font-semibold mb-2 text-green-400">Total Rewards</h4>
            <p className="text-2xl font-bold">$<AnimatedCounter value={1250} />M</p>
          </div>
          
          <div className="text-center p-6 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <h4 className="text-lg font-semibold mb-2 text-purple-400">Avg. APR</h4>
            <p className="text-2xl font-bold"><AnimatedCounter value={24} />%</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 