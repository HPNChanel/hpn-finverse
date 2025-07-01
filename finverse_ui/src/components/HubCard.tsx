
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FeatureHub } from '@/constants/hubs';

interface HubCardProps {
  hub: FeatureHub;
  index: number;
  onExplore: (path: string) => void;
  isHighlighted?: boolean;
}

export function HubCard({ hub, index, onExplore, isHighlighted = false }: HubCardProps) {
  const IconComponent = hub.icon;
  const isComingSoon = hub.status === 'coming-soon';
  const isBeta = hub.status === 'beta';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2, ease: "easeInOut" }
      }}
      className="group relative"
    >
      <Card 
        className={`
          relative overflow-hidden border-0 backdrop-blur-sm cursor-pointer 
          min-h-[320px] hub-card-glow
          bg-white/80 dark:bg-slate-800/80
          ${isHighlighted 
            ? 'ring-2 ring-blue-500/30 bg-gradient-to-br from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20' 
            : ''
          }
          ${isComingSoon ? 'opacity-75' : ''}
        `}
        onClick={() => !isComingSoon && onExplore(hub.path)}
      >
        {/* Animated Background Gradient */}
        <div className={`
          absolute inset-0 bg-gradient-to-br ${hub.color} 
          opacity-0 group-hover:opacity-5 transition-opacity duration-500
        `} />
        
        {/* Floating Background Elements */}
        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
          <Sparkles className="w-8 h-8 text-current animate-pulse" />
        </div>
        
        {/* Status Tag */}
        {hub.tag && (
          <div className="absolute top-4 left-4 z-10">
            <Badge 
              variant={isBeta ? "secondary" : "outline"}
              className={`
                text-xs font-medium
                ${isBeta 
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                }
              `}
            >
              {hub.tag}
            </Badge>
          </div>
        )}

        <CardHeader className="relative pb-4 pt-8">
          <div className="flex items-center gap-4 mb-4">
            <motion.div 
              className={`
                p-4 rounded-2xl bg-gradient-to-br ${hub.color} 
                text-white shadow-lg backdrop-blur-sm
              `}
              whileHover={{ 
                scale: 1.1,
                rotate: [0, -5, 5, 0],
                transition: { duration: 0.4 }
              }}
            >
              <IconComponent className="w-8 h-8" />
            </motion.div>
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold text-gradient-animated group-hover:animate-pulse">
                {hub.name}
              </CardTitle>
            </div>
          </div>
          <CardDescription className="text-base text-muted-foreground leading-relaxed">
            {hub.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="relative">
          {/* Features Grid */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
              Key Features
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {hub.features.map((feature, featureIndex) => (
                <motion.div 
                  key={featureIndex}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + featureIndex * 0.05 }}
                  className="flex items-center text-sm text-muted-foreground bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-3 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50"
                >
                  <motion.div 
                    className={`w-2 h-2 rounded-full bg-gradient-to-r ${hub.color} mr-3 flex-shrink-0`}
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      delay: featureIndex * 0.2
                    }}
                  />
                  <span className="font-medium">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Explore Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              className={`
                w-full font-semibold py-3 transition-all duration-300 relative overflow-hidden
                ${isComingSoon 
                  ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                  : `bg-gradient-to-r ${hub.color} hover:${hub.hoverColor} text-white shadow-lg hover:shadow-xl`
                }
              `}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                if (!isComingSoon) {
                  onExplore(hub.path);
                }
              }}
              disabled={isComingSoon}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isComingSoon ? 'Coming Soon' : 'Explore Hub'}
                {!isComingSoon && (
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                )}
              </span>
              
              {/* Button shine effect */}
              {!isComingSoon && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              )}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 