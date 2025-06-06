# Database Migration Documentation

## Overview

This migration documentation covers the database schema synchronization for FinVerse API, including the modernization of the user authentication system, budget management, critical BudgetPlan cleanup, and module structure consolidation.

## Latest Migration: Email-Based Authentication + Budget System Modernization + BudgetPlan Cleanup + Module Consolidation + AI/Blockchain Enhancement + SQLAlchemy Relationship Fix

### Changes Made

1. **Email-Based Authentication System**:
   - **BREAKING CHANGE**: Removed `username` column from users table completely
   - Added `email` column as unique identifier (unique=True, index=True, nullable=False)
   - Updated all authentication flows to use email exclusively
   - Maintained `name` field for display purposes
   - Updated all API endpoints to use email for login/registration

2. **Budget System Refactoring & BudgetPlan Cleanup**:
   - **CRITICAL FIX**: Removed legacy `budget_plan` table and all relationships
   - **CRITICAL FIX**: Removed broken `budget_plans` relationship from FinancialAccount model
   - **CRITICAL FIX**: Fixed SQLAlchemy NoForeignKeysError by removing invalid foreign key references
   - **CRITICAL FIX**: Added missing `User.budget_alerts` relationship to fix mapping error
   - Enhanced `Budget` model with comprehensive features
   - Added `BudgetAlert` model for threshold notifications
   - Implemented automatic transaction-to-budget linking
   - Added budget status tracking and period management

3. **SQLAlchemy Relationship Fixes**:
   - **CRITICAL FIX**: Added missing `budget_alerts` relationship to User model
   - **CRITICAL FIX**: Fixed bidirectional relationship between User and BudgetAlert
   - **CRITICAL FIX**: Resolved "Mapper 'User' has no property 'budget_alerts'" error
   - **CRITICAL FIX**: Fixed Alembic metadata configuration for autogeneration
   - **CRITICAL FIX**: Added proper Base.metadata target in env.py
   - **CRITICAL FIX**: Fixed ambiguous foreign key error between FinancialAccount and Transaction
   - **CRITICAL FIX**: Added explicit foreign keys for Transaction relationships
   - **CRITICAL FIX**: Added `from __future__ import annotations` to prevent circular imports
   - **CRITICAL FIX**: Separated primary and legacy relationships for wallet_id compatibility
   - Ensured consistent `back_populates` keys across all relationships
   - Fixed user registration 500 errors caused by missing relationships

4. **Module Structure Consolidation**:
   - **BREAKING CHANGE**: Removed all `budget_plan` modules (routers, schemas, services)
   - **BREAKING CHANGE**: Consolidated duplicate budget modules into single structure
   - **BREAKING CHANGE**: Updated all imports to use unified module references
   - **ENDPOINT CHANGE**: Single `/budget` prefix replaces multiple budget endpoints
   - **IMPORT CLEANUP**: Removed deprecated imports and circular dependencies

5. **Financial Precision Enhancement**:
   - Replaced all `Float` types with `DECIMAL(18, 8)` for financial fields
   - Updated: balance, limit_amount, spent_amount, current_amount, target_amount, amount, interest_earned, claimable_rewards
   - Ensures cryptocurrency-level precision (8 decimal places)

6. **Staking Model AI/Blockchain Fields**:
   - Added `blockchain_tx_hash` for blockchain transaction tracking
   - Added `predicted_reward` for ML-based reward predictions
   - Added `model_confidence` for AI model confidence scores
   - Added `ai_tag` for AI-assigned stake pattern categorization
   - Added `claimable_rewards` for separate reward tracking
   - Added `apy_snapshot` for historical APY recording

7. **Unified Staking Model**:
   - **BREAKING CHANGE**: Replaced both `stakes` and `staking_positions` tables with unified `Stake` model
   - **CRITICAL FIX**: Dropped `staking_positions` table (ensure no critical data exists)
   - **ENHANCEMENT**: Combined all staking functionality into single model with comprehensive fields
   - **AI FIELDS**: Added `model_confidence`, `ai_tag`, `predicted_reward` for ML analytics
   - **BLOCKCHAIN**: Enhanced `tx_hash` tracking and validation
   - **PRECISION**: All financial fields use DECIMAL(18,8) for crypto-level precision
   - **TIME TRACKING**: Added `unlock_at` field for precise unlock time calculation
   - **REWARDS**: Separate tracking of `claimable_rewards` and `rewards_earned`

8. **Pydantic v2 Migration**:
   - Updated all schemas to use `@field_validator` with `@classmethod`
   - Replaced `Config` classes with `model_config = ConfigDict(...)`
   - Updated `orm_mode = True` to `from_attributes = True`
   - Added proper forward reference handling

### Critical Module Cleanup

| Deprecated Component | Replacement | Status |
|---------------------|-------------|---------|
| `staking_positions` table | Unified `stakes` table | ✅ Dropped |
| `StakingPosition` model | Unified `Stake` model | ✅ Removed |
| Multiple staking models | Single `Stake` model | ✅ Consolidated |

### Unified Staking Model Features

| Field | Type | Purpose | Enhancement |
|-------|------|---------|-------------|
| pool_id | String(50) | Pool identifier | Indexed for performance |
| amount | DECIMAL(18,8) | Crypto precision | 8 decimal places |
| unlock_at | DateTime | Precise unlock time | Calculated automatically |
| apy_snapshot | DECIMAL(5,2) | Historical APY | Rate at staking time |
| claimable_rewards | DECIMAL(18,8) | Available rewards | Real-time tracking |
| model_confidence | Float | AI confidence | ML model score |
| ai_tag | String(50) | AI categorization | Pattern recognition |
| predicted_reward | DECIMAL(18,8) | ML prediction | 1-year estimation |

### Critical SQLAlchemy Fixes

| Issue | Solution | Impact |
|-------|----------|---------|
| NoForeignKeysError on FinancialAccount.budget_plans | Removed broken relationship completely | ✅ Fixed registration endpoint |
| Invalid BudgetPlan foreign keys | Removed all BudgetPlan references | ✅ Fixed model initialization |
| Missing User.budget_alerts relationship | Added bidirectional relationship | ✅ Fixed registration 500 error |
| Transaction-FinancialAccount relationship mismatch | Added financial_account_id field and proper back_populates | ✅ Fixed FK mapping errors |
| Account creation with initial transaction | Fixed commit sequence to get account.id before transaction | ✅ Fixed 500 error on account creation |
| Missing wallet_id validation | Added proper validation for wallet_id in transaction creation | ✅ Fixed transaction creation errors |
| Transaction type enum handling | Added safe enum value comparison using .value | ✅ Fixed enum comparison issues |
| SQLAlchemy session rollback | Improved rollback handling in error scenarios | ✅ Fixed database consistency |
| Frontend-backend data mismatch | Updated CreateTransactionRequest to include all required fields | ✅ Fixed API compatibility |

### SQLAlchemy Relationship Resolution

The ambiguous foreign key error between `FinancialAccount` and `Transaction` has been resolved:

| Model | Relationship | Foreign Key | Purpose |
|-------|-------------|-------------|---------|
| Transaction | financial_account | financial_account_id | Primary relationship |
| Transaction | wallet | wallet_id | Backward compatibility |
| FinancialAccount | transactions | Transaction.financial_account_id | Primary transactions |
| FinancialAccount | wallet_transactions | Transaction.wallet_id | Legacy transactions |

**Resolution Steps:**
1. Added explicit `foreign_keys` parameter to all ambiguous relationships
2. Used `from __future__ import annotations` to prevent circular imports
3. Added `overlaps` parameter to handle multiple relationships to same table
4. Separated primary and legacy relationships for clean data access

### User Model Changes (BREAKING)

| Old Field | New Field | Type | Purpose | Migration Notes |
|-----------|-----------|------|---------|-----------------|
| username | email | String(255) | Primary identifier | **Complete replacement - username concept removed** |
| - | - | - | - | All authentication now uses email exclusively |

**Migration Strategy for Users Table:**
1. All existing username data will be replaced with email
2. If usernames are not emails, manual data migration required before running migration
3. Update all authentication endpoints to use email exclusively
4. Frontend applications must be updated to use email fields
5. OAuth2 'username' field now expects email address

### API Endpoint Changes (BREAKING)

| Old Endpoint | New Endpoint | Status |
|--------------|--------------|---------|
| `/auth/register` | `/auth/register` | Updated payload (email vs username) |
| `/auth/login` | `/auth/login` | Updated payload (email vs username) |
| `/budget-plan/*` | `/budget/*` | Completely replaced |
| `/budgets/*` | `/budget/*` | Consolidated |

### Module Import Changes (BREAKING)

| Old Import | New Import |
|------------|------------|
| `from app.routers.budget_plan import ...` | `from app.routers.budget import ...` |
| `from app.schemas.budget_plan import ...` | `from app.schemas.budget import ...` |
| `from app.services.budget_plan_service import ...` | `from app.services.budget_service import ...` |
| `from app.routers.budgets import ...` | `from app.routers.budget import ...` |

### Budget Model Enhancements

| Field | Type | Purpose | Comment |
|-------|------|---------|---------|
| id | BigInteger | Primary key | Auto-increment ID |
| user_id | BigInteger | Relational | FK to users |
| category_id | BigInteger | Relational | FK to categories |
| name | String(100) | UI Display | Budget name |
| limit_amount | DECIMAL(18,8) | Financial Core | Budget limit with precision |
| spent_amount | DECIMAL(18,8) | Financial Core | Amount spent (auto-calculated) |
| period_type | Enum | Business Logic | Weekly/Monthly/Quarterly/Yearly/Custom |
| start_date | Date | Business Logic | Budget period start |
| end_date | Date | Business Logic | Budget period end |
| alert_threshold | Enum | Business Logic | 50%/75%/90%/100% thresholds |
| status | Enum | Business Logic | Active/Exceeded/Completed/Paused |
| is_active | Boolean | Business Logic | Budget active status |

### Data Type Consistency
- Financial amounts: `DECIMAL(18, 8)` with proper defaults
- Rates/percentages: `DECIMAL(5, 4)` or `DECIMAL(5, 2)` as appropriate
- AI confidence: `Float` (0.0-1.0 range)
- Blockchain hashes: `String(100)`
- Email addresses: `String(255)` with unique constraint

## Migration Steps

1. **CRITICAL: Backup existing data** before running migration
2. **Verify Alembic environment** is properly configured
3. **Plan username → email data migration** if needed
4. **Update frontend applications** to use email instead of username
5. **Test migration** on development environment first
6. **Remove deprecated module imports** from all code files
7. **Update API services** to handle DECIMAL types properly
8. **Update Pydantic schemas** to use v2 patterns
9. **Test authentication flows** with email-based login
10. **Update documentation** and API specs
11. **Test AI/Blockchain integrations** with new fields
12. **Verify SQLAlchemy model loading** without errors
13. **Test consolidated budget endpoints**

## API Changes

### Authentication (BREAKING CHANGES)
- **Registration**: Now requires `email` instead of `username`
- **Login**: Now uses `email` and `password`
- **OAuth2 Token**: `username` field should contain email address
- **User responses**: Return `email` instead of `username`

### Removed Endpoints
- `/budget-plan/*` - Completely replaced by `/budget/*`
- Duplicate `/budgets/*` endpoints consolidated

### Enhanced Endpoints
- `/budget/` - Full CRUD operations with automatic tracking
- `/budget/{id}/update-usage` - Manual budget recalculation
- `/budget/alerts/list` - Budget threshold alerts
- `/budget/summary/stats` - Budget summary statistics

## Frontend Integration Notes

### Required Changes
1. **Login Forms**: Change username field to email field
2. **Registration Forms**: Update to use email instead of username
3. **User Profile**: Display email instead of username
4. **API Calls**: Update all authentication API calls
5. **Local Storage**: Update stored user data structure
6. **Validation**: Implement email validation on frontend
7. **Budget Endpoints**: Update all budget API calls to use `/budget/*`
8. **Import Statements**: Update any direct module imports

### Backward Compatibility
- **None** - This is a breaking change
- All client applications must be updated simultaneously
- Consider feature flags for gradual rollout

## Pydantic v2 Migration Notes

### Schema Updates
- Replaced `@validator` with `@field_validator` and `@classmethod` decorator
- Replaced `orm_mode = True` with `from_attributes = True` in ConfigDict
- Added `from __future__ import annotations` for self-referencing schemas
- Removed deprecated `model_rebuild()` calls
- Updated generic response schemas
- Added proper email validation to all relevant schemas

### Breaking Changes
- Field validators now require `@classmethod` decorator
- Config `orm_mode` is now `from_attributes`
- Forward references handled automatically with `__future__` imports
- Generic models now use `BaseModel, Generic[T]` pattern
- `dict()` method replaced with `model_dump()` in Pydantic v2

## Testing Checklist

- [ ] Unified Stake model loads without errors
- [ ] Alembic can autogenerate migrations with unified model
- [ ] staking_positions table is dropped safely
- [ ] All staking endpoints work with unified model
- [ ] AI analytics fields populate correctly
- [ ] Blockchain transaction hash validation works
- [ ] **SQLAlchemy relationships load without ambiguous foreign key errors**
- [ ] **Transaction-FinancialAccount relationships work correctly**
- [ ] **Both primary and legacy wallet relationships function**
- [ ] **Forward references resolve without circular import issues**
- [ ] **User registration works without relationship mapping errors**
- [ ] **Financial precision calculations maintain accuracy**

## Notes

The user authentication system modernization removes the username concept entirely in favor of email-based authentication, which is more user-friendly and industry-standard. The critical BudgetPlan cleanup fixes the SQLAlchemy relationship errors that were causing 500 errors during user registration. The module consolidation eliminates duplicate code and import conflicts. This is a breaking change that requires coordinated updates across frontend and backend systems. The budget system modernization provides enhanced functionality with a clean, unified module structure. All financial calculations now use DECIMAL precision, and the automatic transaction linking ensures real-time budget tracking.

**⚠️ CRITICAL**: All budget_plan modules and duplicate budget modules have been completely removed. All budget functionality now uses the unified Budget module exclusively.

## Module Naming Convention Updates

The system now follows standardized naming conventions:

### Router Naming Convention
- **Singular filenames**: `user.py`, `transaction.py`, `category.py`, `budget.py`
- **Unified imports**: All routers imported through `app.routers` module
- **Clean router registration**: Centralized router management in `__init__.py`

### Import Structure
```python
# Clean router imports
from app.routers import user, transaction, category, budget
from app.routers import financial_account, financial_goal, staking

# Unified router registration
routers = [
    user.router,
    transaction.router,
    category.router,
    budget.router,
    # ...
]
```

## Final Module Status

| Component | Status | Naming Convention |
|-----------|--------|------------------|
| Router files | ✅ Standardized | Singular names (user.py, transaction.py) |
| Import structure | ✅ Clean | Centralized through __init__.py |
| Module references | ✅ Updated | No deprecated imports |
| File naming | ✅ Consistent | lowercase_singular.py pattern |