# Database Migration Documentation

## Overview

This migration documentation covers the database schema synchronization for FinVerse API.

## Latest Migration: Sync Financial Goals Schema

### Changes Made

1. **Financial Goals Table Updates**:
   - Extended `name` column from 100 to 255 characters
   - Made `current_amount` non-nullable with default value 0.0
   - Made `description`, `icon`, and `color` nullable
   - Added proper default values for `priority` (2), `status` (1)
   - Added default values for `icon` ('🎯') and `color` ('#1976d2')
   - Ensured proper indexing on `id` and `user_id` columns

2. **Data Type Consistency**:
   - All amount fields use `Float` type
   - Date fields use `Date` type (not DateTime)
   - Integer fields for priority and status with proper constraints

3. **Schema Safety**:
   - All changes are backward compatible
   - Default values prevent null constraint violations
   - Foreign key relationships maintained

## How to Apply the Migration

### Method 1: Using the Helper Script

```bash
cd finverse_api
python create_migration.py  # Generate if needed
python run_migration.py     # Apply migration
```

### Method 2: Using Alembic Directly

```bash
cd finverse_api
alembic revision --autogenerate -m "Sync models with DB"
alembic upgrade head
```

## Verification Steps

After applying the migration:

1. **Check Table Structure**:
   ```sql
   DESCRIBE financial_goals;
   ```

2. **Verify Constraints**:
   ```sql
   SHOW CREATE TABLE financial_goals;
   ```

3. **Test API Endpoints**:
   - POST /goals (create goal)
   - GET /goals (list goals) 
   - PUT /goals/{id} (update goal)

## Rollback Procedure

If needed, you can downgrade the migration:

```bash
cd finverse_api
alembic downgrade add_created_at_column
```

## Previous Migrations

### Database Unification Migration
- Merged `internal_transactions` into `transactions` table
- Consolidated staking data by combining `staking_accounts` into `stakes`

### Budget Plans Migration
- Added `created_at` column to budget_plans table
- Cleaned up duplicate columns

## Troubleshooting

### Common Issues

1. **Migration fails with "Table already exists"**:
   - This is expected if the table exists
   - The migration handles this gracefully

2. **Column already exists errors**:
   - Migration includes try/catch blocks for existing columns
   - Check the output for which changes were applied

3. **Foreign key constraint errors**:
   - Ensure users table exists before running migration
   - Check that user_id values in goals reference valid users

### Database State Verification

```python
# Python script to verify migration
from app.db.session import SessionLocal
from app.models.financial_goal import FinancialGoal

db = SessionLocal()
try:
    # Test that the model works
    goals = db.query(FinancialGoal).limit(5).all()
    print(f"Found {len(goals)} goals")
    
    # Test creating a goal
    test_goal = FinancialGoal(
        user_id=1,
        name="Test Goal",
        target_amount=1000.0,
        start_date="2024-01-01",
        target_date="2024-12-31"
    )
    print("Goal model validation passed")
    
finally:
    db.close()
```

## Next Steps

After successful migration:
1. Test the Goals API endpoints thoroughly
2. Verify form submissions work correctly
3. Check that validation errors are handled properly
4. Monitor application logs for any database-related issues