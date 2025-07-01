
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight,
  Star,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { HubCard } from '@/components/HubCard';
import { featureHubs } from '@/constants/hubs';

const floatingElements = [
  { icon: Sparkles, delay: 0, duration: 3 },
  { icon: Star, delay: 1, duration: 4 },
  { icon: Zap, delay: 2, duration: 3.5 },
];

export function Home() {
  const navigate = useNavigate();
  const { hubId } = useParams();
  const { user } = useAuth();

  const handleExplore = (path: string) => {
    navigate(path);
  };

  const quickAccessButtons = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Accounts', path: '/accounts' },
    { label: 'Transactions', path: '/transactions' },
    { label: 'Staking', path: '/staking' },
    { label: 'Savings', path: '/savings' },
    { label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingElements.map((element, index) => {
          const IconComponent = element.icon;
          const animationClass = index === 0 ? 'float-animation' : index === 1 ? 'float-animation-delayed' : 'float-animation-slow';
          return (
            <motion.div
              key={index}
              className={`absolute opacity-5 dark:opacity-10 ${animationClass}`}
              style={{
                top: `${20 + index * 30}%`,
                left: `${10 + index * 25}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: element.duration,
                repeat: Infinity,
                delay: element.delay,
                ease: "easeInOut"
              }}
            >
              <IconComponent className="w-24 h-24 text-blue-500/30" />
            </motion.div>
          );
        })}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-6 relative"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent animate-pulse">
              FinVerse
            </span>
            <motion.div
              className="absolute -top-2 -right-2 text-yellow-400"
              animate={{ 
                rotate: [0, 15, -15, 0],
                scale: [1, 1.2, 1] 
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-3xl text-muted-foreground mb-3 font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Your Complete Financial Universe
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <p className="text-lg text-muted-foreground leading-relaxed">
              Welcome back, <span className="font-semibold text-foreground">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </span>! 
              Choose a feature hub below to continue your financial journey with intelligent insights and powerful tools.
            </p>
          </motion.div>
        </motion.div>

        {/* Feature Hubs Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-8 mb-16 max-w-6xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          {featureHubs.map((hub, index) => (
            <HubCard
              key={hub.id}
              hub={hub}
              index={index}
              onExplore={handleExplore}
              isHighlighted={hubId === hub.id}
            />
          ))}
        </motion.div>

        {/* Quick Access Section */}
        <motion.div 
          className="text-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 border border-white/20 dark:border-slate-700/30 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <motion.h3 
            className="text-lg font-semibold mb-2 text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            Need Quick Access?
          </motion.h3>
          <motion.p 
            className="text-sm text-muted-foreground mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
          >
            Jump directly to any feature for instant access
          </motion.p>
          
          <motion.div 
            className="flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            {quickAccessButtons.map((button, index) => (
              <motion.div
                key={button.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="outline" 
                  size="sm"
                  className="group hover:bg-primary hover:text-primary-foreground transition-all duration-300 border-slate-200 dark:border-slate-700"
                  onClick={() => navigate(button.path)}
                >
                  {button.label}
                  <motion.div
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{ x: [0, 2, 0] }}
                    transition={{ 
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <ArrowRight className="w-3 h-3" />
                  </motion.div>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Footer Note */}
        <motion.div 
          className="text-center mt-12 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <p>Hover over any hub to see interactive previews and explore available features.</p>
        </motion.div>
      </div>
    </div>
  );
} 