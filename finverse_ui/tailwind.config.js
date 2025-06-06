/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		screens: {
  			'xs': '475px',
  			'sm': '640px',
  			'md': '768px',
  			'lg': '1024px',
  			'xl': '1280px',
  			'2xl': '1536px',
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  			'128': '32rem',
  		},
  		minHeight: {
  			'0': '0',
  			'1/4': '25%',
  			'1/2': '50%',
  			'3/4': '75%',
  			'full': '100%',
  			'screen': '100vh',
  			'screen-75': '75vh',
  			'screen-50': '50vh',
  		},
  		maxHeight: {
  			'0': '0',
  			'1/4': '25%',
  			'1/2': '50%',
  			'3/4': '75%',
  			'full': '100%',
  			'screen': '100vh',
  			'screen-75': '75vh',
  			'screen-50': '50vh',
  		},
  		keyframes: {
  			"accordion-down": {
  				from: { height: "0" },
  				to: { height: "var(--radix-accordion-content-height)" },
  			},
  			"accordion-up": {
  				from: { height: "var(--radix-accordion-content-height)" },
  				to: { height: "0" },
  			},
  			"collapsible-down": {
  				from: { height: "0" },
  				to: { height: "var(--radix-collapsible-content-height)" },
  			},
  			"collapsible-up": {
  				from: { height: "var(--radix-collapsible-content-height)" },
  				to: { height: "0" },
  			},
  			"slide-in-from-top": {
  				"0%": { transform: "translateY(-100%)" },
  				"100%": { transform: "translateY(0)" },
  			},
  			"slide-out-to-top": {
  				"0%": { transform: "translateY(0)" },
  				"100%": { transform: "translateY(-100%)" },
  			},
  			"fade-in": {
  				"0%": { opacity: "0" },
  				"100%": { opacity: "1" },
  			},
  			"fade-out": {
  				"0%": { opacity: "1" },
  				"100%": { opacity: "0" },
  			},
  		},
  		animation: {
  			"accordion-down": "accordion-down 0.2s ease-out",
  			"accordion-up": "accordion-up 0.2s ease-out",
  			"collapsible-down": "collapsible-down 0.2s ease-out",
  			"collapsible-up": "collapsible-up 0.2s ease-out",
  			"slide-in-from-top": "slide-in-from-top 0.3s ease-out",
  			"slide-out-to-top": "slide-out-to-top 0.3s ease-out",
  			"fade-in": "fade-in 0.2s ease-out",
  			"fade-out": "fade-out 0.2s ease-out",
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
