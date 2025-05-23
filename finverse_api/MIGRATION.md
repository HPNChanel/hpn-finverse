# Database Migration Documentation

## Overview

This migration unifies the database schema by:
1. Merging `internal_transactions` into the `transactions` table
2. Consolidating staking data by combining `staking_accounts` into `stakes`

## Migration Details

### 1. Transactions Table Modification

The `transactions` table has been modified to add:
- `from_account_id` (nullable, int, foreign key to financial_accounts.id)
- `to_account_id` (nullable, int, foreign key to financial_accounts.id)

This allows tracking of internal transfers within the same table:
- When both fields are filled, the transaction is considered an internal transfer
- Regular income/expense transactions will have these fields set to NULL

### 2. Internal Transactions Removal

The `internal_transactions` table has been removed with its data migrated to the `transactions` table:
- All data from `internal_transactions` is copied to `transactions`
- Transaction type is set to 'TRANSFER'
- Notes are preserved as transaction descriptions

### 3. Staking Tables Consolidation

The `stakes` table has been enhanced with additional fields:
- `name` (varchar(100))
- `address` (varchar(255))
- `balance` (float)
- `is_active` (boolean)

This eliminates the need for a separate `staking_accounts` table.

## How to Apply the Migration

### Method 1: Using Alembic Directly

```bash
cd finverse_api
alembic upgrade head
```

### Method 2: Using the Helper Script

```bash
cd finverse_api
python run_migration.py
```

## Rollback Procedure

If needed, you can downgrade the migration with:

```bash
cd finverse_api
alembic downgrade 8ff4fdf720d4
```

This will:
1. Recreate the original `staking_accounts` and `internal_transactions` tables
2. Migrate data back to the original schema
3. Remove the added columns from `transactions` and `stakes`

## After Migration

The new schema supports:
- Internal transfers in the `transactions` table
- Unified staking information in the `stakes` table
- All previous functionality without data loss

## Verification

After applying the migration, verify that:
1. All internal transfers are correctly visible in the transactions API
2. Staking functionality works with the unified table structure
3. Foreign key constraints are maintained 