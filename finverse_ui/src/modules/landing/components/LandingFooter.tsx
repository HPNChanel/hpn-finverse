import { motion } from 'framer-motion'
import { Github, BookOpen, Shield, FileText, Twitter, MessageCircle, Mail } from 'lucide-react'

const footerLinks = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Demo', href: '#demo' },
    { name: 'Roadmap', href: '#roadmap' }
  ],
  developers: [
    { name: 'Documentation', href: '#docs', icon: BookOpen },
    { name: 'API Reference', href: '#api' },
    { name: 'GitHub', href: 'https://github.com', icon: Github },
    { name: 'Community', href: '#community' }
  ],
  legal: [
    { name: 'Privacy Policy', href: '#privacy', icon: Shield },
    { name: 'Terms of Service', href: '#terms', icon: FileText },
    { name: 'Cookie Policy', href: '#cookies' },
    { name: 'Security', href: '#security' }
  ],
  social: [
    { name: 'Twitter', href: 'https://twitter.com', icon: Twitter },
    { name: 'Discord', href: 'https://discord.com', icon: MessageCircle },
    { name: 'Contact', href: 'mailto:hello@finverse.com', icon: Mail }
  ]
}

export function LandingFooter() {
  return (
    <footer className="relative py-20 px-4 sm:px-6 lg:px-8 border-t border-border/50">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background to-transparent" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand section */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                FinVerse
              </h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                Revolutionizing personal finance through the power of AI and DeFi. 
                Join the future of financial freedom today.
              </p>
            </div>

            {/* Newsletter signup */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Stay Updated</h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 rounded-lg bg-card border border-border/50 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
                  Subscribe
                </button>
              </div>
            </div>
          </motion.div>

          {/* Product links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-6">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-blue-400 transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Developer links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-6">Developers</h4>
            <ul className="space-y-3">
              {footerLinks.developers.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="flex items-center gap-2 text-muted-foreground hover:text-blue-400 transition-colors duration-300"
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {link.icon && <link.icon size={16} />}
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-6">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="flex items-center gap-2 text-muted-foreground hover:text-blue-400 transition-colors duration-300"
                  >
                    {link.icon && <link.icon size={16} />}
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Social links and bottom section */}
        <motion.div
          className="pt-8 border-t border-border/50"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Social links */}
            <div className="flex items-center gap-6">
              {footerLinks.social.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="p-2 rounded-lg bg-card/50 border border-border/30 text-muted-foreground hover:text-blue-400 hover:border-blue-400/50 transition-all duration-300 transform hover:scale-110"
                  target={social.href.startsWith('http') ? '_blank' : undefined}
                  rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  title={social.name}
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>

            {/* Copyright */}
            <div className="text-center md:text-right">
              <p className="text-muted-foreground text-sm">
                © 2024 FinVerse. All rights reserved.
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Built with ❤️ for the future of finance
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bottom glow effect */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      </div>
    </footer>
  )
} 