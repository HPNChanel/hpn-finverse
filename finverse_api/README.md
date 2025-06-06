# FinVerse API

A comprehensive financial management API built with FastAPI, SQLAlchemy, and MySQL. Features include email-based authentication, virtual accounts, budgeting, goal tracking, **enhanced staking with frontend sync**, **blockchain synchronization**, and AI-enhanced analytics.

## 🏗️ Clean Architecture with Explicit Exports

The FinVerse API follows a clean, modular architecture pattern with explicit exports to prevent import errors:

```
app/
├── routers/          # FastAPI route definitions (API layer)
│   └── __init__.py   # Explicit router exports
├── services/         # Business logic layer  
│   └── __init__.py   # Explicit service exports
├── models/           # SQLAlchemy ORM models (data layer)
│   └── __init__.py   # Explicit model exports
├── schemas/          # Pydantic schemas (validation layer)
│   └── __init__.py   # Explicit schema exports
├── core/             # Configuration, security, utilities
├── db/               # Database session and engine
├── middleware/       # Custom middleware
├── utils/            # Utility functions
└── main.py           # Application entry point with explicit imports
```

## Features

- **User Management**: Email-based authentication and profile management
- **Virtual Financial Accounts**: Multiple account types (wallet, savings, investment, goal)
- **Transaction Management**: Income and expense tracking with category support
- **Modern Budget System**: Category-based budgets with automatic spending tracking and alerts
- **Financial Goals**: Goal setting with account-linked progress tracking
- **Enhanced Staking System**: Cryptocurrency staking with frontend sync, AI-powered predictions, and position tracking
- **🔗 Blockchain Synchronization**: Real-time sync between smart contracts and database
- **Analytics**: Monthly statistics and spending insights

## 🔗 Blockchain Synchronization

The FinVerse API now includes a comprehensive blockchain synchronization system that keeps the database in perfect sync with smart contract data:

### 🎯 **NEW**: Blockchain Sync Features

- **📊 Cron Job Sync**: Automated sync every 10 seconds to fetch contract data
- **🔄 Real-time WebSocket Listener**: Instant sync on blockchain events
- **🗄️ Database Comparison**: Smart comparison and conflict resolution
- **📡 API Management**: RESTful control of sync services
- **📈 Health Monitoring**: Comprehensive sync status tracking
- **🛡️ Error Handling**: Robust error recovery and logging

### 🚀 **Blockchain Sync Endpoints**

- **`/sync/start`**: Start blockchain synchronization services
- **`/sync/stop`**: Stop synchronization services  
- **`/sync/status`**: Get current sync status and statistics
- **`/sync/user`**: Force sync for a specific user address
- **`/sync/run-cycle`**: Manually trigger a complete sync cycle
- **`/sync/health`**: Health check for sync services

### 🔧 **Sync Service Usage**

```bash
# Start blockchain sync (10-second intervals)
curl -X POST "http://localhost:8000/api/v1/sync/start"

# Check sync status
curl "http://localhost:8000/api/v1/sync/status"

# Sync specific user
curl -X POST "http://localhost:8000/api/v1/sync/user" \
     -H "Content-Type: application/json" \
     -d '{"user_address": "0x1234..."}'

# Stop sync services
curl -X POST "http://localhost:8000/api/v1/sync/stop"
```

### 🏗️ **Sync Architecture**

1. **BlockchainSyncService**: Fetches data from smart contracts
2. **WebSocketSyncService**: Listens for real-time blockchain events  
3. **SyncScheduler**: Coordinates both sync services
4. **Database Comparison**: Handles creates, updates, and deletions
5. **Error Recovery**: Graceful handling of network issues

## Database Structure

The enhanced database system uses the following core tables with improved relationships:

### Core Tables
- `users`: Email-based user authentication and profile data
- `financial_accounts`: Virtual account management (wallet, saving, investment, goal)
- `categories`: Transaction categorization system with hierarchical support
- `transactions`: All financial transactions with category and budget linking
- `budgets`: Modern budget system with automatic transaction tracking and alerts
- `budget_alerts`: Budget threshold notifications with read status
- `financial_goals`: Goal tracking with optional account linking
- `stakes`: **Unified staking model** with AI/blockchain enhancements
- **`staking_logs`**: Blockchain event synchronization logs

### 🔗 **Blockchain Integration**
- **DECIMAL(18,8) Precision**: Cryptocurrency-level financial precision
- **AI Predictions**: ML-based reward forecasting for staking
- **Blockchain Integration**: Transaction hash tracking and verification
- **Smart Analytics**: Confidence scoring and pattern recognition
- **Real-time Sync**: Contract-to-database synchronization
- **Event Logging**: Complete audit trail of blockchain events

## API Structure with Explicit Exports

- `/auth`: Email-based user authentication endpoints
- `/users`: User profile management (singular naming)
- `/accounts`: Financial account management
- `/transactions`: Transaction CRUD operations
- `/budget`: **Unified budget management** with automatic tracking and alerts
- `/goals`: Financial goal tracking
- `/staking`: **Enhanced staking operations** with frontend sync and AI insights
- `/categories`: Category management (singular naming)
- `/dashboard`: **Dashboard data aggregation** with comprehensive analytics
- **`/sync`**: **🔗 Blockchain synchronization management**

### 🎯 **ENHANCED**: Staking & Blockchain Sync

- **Enhanced**: Unified Stake model with blockchain tracking
- **Real-time Sync**: Contract events trigger immediate database updates
- **Smart Conflict Resolution**: Handles data inconsistencies gracefully
- **Performance Optimized**: Efficient bulk operations and caching
- **Audit Trail**: Complete history of all sync operations

## 🚀 Getting Started with Blockchain Sync

1. **Configure Contract Addresses** (in environment or config):
   ```python
   WEB3_RPC_URL = "http://127.0.0.1:8545"
   TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
   STAKE_VAULT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
   ```

2. **Start the API** with auto-sync disabled (manual control):
   ```bash
   uvicorn app.main:app --reload
   ```

3. **Enable Synchronization**:
   ```bash
   curl -X POST "http://localhost:8000/api/v1/sync/start"
   ```

4. **Monitor Sync Status**:
   ```bash
   curl "http://localhost:8000/api/v1/sync/status"
   ```

The system will automatically sync all user stakes, handle new transactions, and keep your database perfectly synchronized with the blockchain! 🎉