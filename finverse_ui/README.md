# FinVerse - Financial Management UI

A modern financial management application built with React, TypeScript, and Vite. FinVerse helps users manage their finances, track transactions, set goals, and participate in staking programs.

## Features

- **Dashboard** - Overview of financial status and recent activity
- **Account Management** - Manage multiple financial accounts
- **Transaction Tracking** - Record and categorize transactions
- **Budget Management** - Create and monitor budgets with alerts
- **Financial Goals** - Set and track financial objectives
- **Staking Platform** - Participate in staking programs with AI predictions
- **Category Management** - Organize transactions by categories

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Tailwind CSS, Radix UI, Lucide React
- **Routing**: React Router v6
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- FinVerse API running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   ├── RequireAuth.tsx # Authentication guard
│   └── ProtectedRoute.tsx # Route protection
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx     # Authentication context
│   └── use-toast.tsx   # Toast notifications
├── layouts/            # Page layouts
│   └── MainLayout.tsx  # Main application layout
├── pages/              # Page components
│   ├── Dashboard.tsx   # Dashboard page
│   ├── Login.tsx       # Login page
│   ├── Register.tsx    # Registration page
│   ├── Accounts.tsx    # Account management
│   ├── Transactions.tsx # Transaction history
│   ├── Categories.tsx  # Category management
│   ├── Budgets.tsx     # Budget management
│   ├── Goals.tsx       # Financial goals
│   └── Staking.tsx     # Staking platform
├── lib/                # Utility libraries
└── utils/              # Helper utilities
```

## Authentication

The application uses email-based authentication with JWT tokens. Users must register with email, password, and name, then login to access protected routes.

## Navigation Issues Troubleshooting

If you experience navigation issues where pages redirect to dashboard:

1. **Check Authentication Status**
   - Ensure you're logged in with a valid token
   - Check browser developer tools for authentication errors

2. **Clear Browser Storage**
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   ```

3. **Verify API Connection**
   - Ensure backend API is running on `http://localhost:8000`
   - Check network tab for failed API calls

4. **Component Loading Issues**
   - Check browser console for component import errors
   - Verify all page components exist and export correctly

## API Integration

The frontend communicates with the FinVerse API at `http://localhost:8000/api/v1/`. Key endpoints:

- `POST /auth/login` - User login with email/password
- `POST /auth/register` - User registration
- `GET /users/me` - Get current user profile
- `GET /financial-accounts/` - List user accounts
- `GET /transactions/` - List transactions
- `GET /categories/` - List categories
- `GET /budgets/` - List budgets
- `GET /financial-goals/` - List goals
- `GET /staking/` - List stakes

## Development

### Adding New Pages

1. Create component in `src/pages/`
2. Add route to `src/App.tsx`
3. Add navigation link to `src/layouts/MainLayout.tsx`
4. Ensure proper authentication protection

### Styling

- Uses Tailwind CSS for styling
- Custom CSS variables for theming
- Responsive design with mobile-first approach

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.
