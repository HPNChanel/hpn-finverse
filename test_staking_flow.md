# ETH-Only Staking Flow Test Guide

## ✅ Implementation Summary

### Frontend Changes (finverse_ui)
1. **StakeTokenForm.tsx** - Updated to use `window.ethereum.request` for MetaMask interaction
2. **API Integration** - Uses axios via `stakingApi.recordStakingPosition()` to save to backend
3. **Error Handling** - Proper MetaMask rejection handling (code 4001)
4. **Transaction Flow**:
   - User enters ETH amount and selects pool
   - MetaMask opens for transaction confirmation
   - ETH is deducted immediately after user confirms
   - Transaction hash is captured and stored
   - Backend API call records stake data

### Backend Changes (finverse_api)
1. **StakingService** - Enhanced `save_stake()` method to create both `Stake` and `StakingLog` records atomically
2. **Database Models** - Added `StakingLog` model to track blockchain events
3. **API Endpoints** - `/staking/record` endpoint validates and saves stake data
4. **Pool Configuration** - ETH-only pools (0, 1, 2) with different APY rates
5. **Transaction Validation** - Validates transaction hash format and prevents duplicates

### Database Schema
1. **stakes** table - Main staking positions
2. **staking_logs** table - Blockchain event logs with proper indexes
3. **Atomic Transactions** - Both records created in single database transaction

## 🧪 Testing Steps

### 1. Start Backend Services
```bash
cd finverse_api
# Run database migrations
alembic upgrade head

# Start API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start Frontend
```bash
cd finverse_ui
npm run dev
```

### 3. Test Staking Flow
1. Connect MetaMask wallet
2. Navigate to staking page
3. Enter ETH amount (e.g., 0.5 ETH)
4. Select pool (ETH Flexible Pool, ETH Premium Pool, etc.)
5. Click "Stake ETH" button
6. Confirm transaction in MetaMask
7. Verify success toast appears
8. Check database for records:

```sql
-- Check stakes table
SELECT * FROM stakes WHERE tx_hash = 'YOUR_TX_HASH';

-- Check staking_logs table
SELECT * FROM staking_logs WHERE tx_hash = 'YOUR_TX_HASH';
```

### 4. Verify API Response
```bash
# Test record endpoint
curl -X POST "http://localhost:8000/api/v1/staking/record" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "poolId": "0",
    "amount": 0.5,
    "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "lockPeriod": 0
  }'
```

## ✅ Expected Results

### Frontend
- MetaMask opens correctly
- ETH balance decreases after confirmation
- Success toast shows "Staking Successful!"
- Transaction hash displayed
- UI refreshes to show new stake

### Backend
- New record in `stakes` table with correct data
- New record in `staking_logs` table with same tx_hash
- Both records have matching user_id and stake_id
- API returns success response with stake details

### Database Verification
```sql
-- Verify atomic creation
SELECT 
  s.id as stake_id,
  s.amount as stake_amount,
  s.tx_hash,
  sl.id as log_id,
  sl.amount as log_amount,
  sl.tx_hash as log_tx_hash
FROM stakes s
JOIN staking_logs sl ON s.id = sl.stake_id
WHERE s.tx_hash = 'YOUR_TX_HASH';
```

## 🚨 Error Scenarios to Test

1. **MetaMask Rejection** - User cancels transaction
2. **Insufficient Balance** - Try to stake more ETH than available
3. **Invalid Pool ID** - Use non-existent pool
4. **Duplicate Transaction** - Try to record same tx_hash twice
5. **Network Issues** - Test with disconnected wallet

## 📊 Pool Configuration

| Pool ID | Name | APY | Min Stake | Max Stake |
|---------|------|-----|-----------|-----------|
| 0 | ETH Flexible Pool | 8.0% | 0.1 ETH | 100 ETH |
| 1 | ETH Premium Pool | 12.0% | 1.0 ETH | 1000 ETH |
| 2 | ETH High Yield Pool | 15.0% | 5.0 ETH | 500 ETH |

## 🔧 Troubleshooting

### Common Issues
1. **Migration Error** - Run `alembic upgrade head`
2. **Import Error** - Ensure `StakingLog` is in `models/__init__.py`
3. **MetaMask Not Detected** - Check `window.ethereum` availability
4. **CORS Issues** - Verify API CORS settings
5. **Auth Token** - Ensure valid JWT token in localStorage

### Debug Commands
```bash
# Check database tables
python -c "from app.models import Base; print([t.name for t in Base.metadata.tables.values()])"

# Test API endpoint
curl -X GET "http://localhost:8000/api/v1/staking/pools"

# Check logs
tail -f logs/api.log
```

## ✅ Success Criteria

- [x] MetaMask opens on stake button click
- [x] ETH deducted immediately after confirmation
- [x] Transaction hash captured and stored
- [x] Stake record created in `stakes` table
- [x] Log record created in `staking_logs` table
- [x] Both records created atomically
- [x] All API calls use axios (no fetch for backend calls)
- [x] Proper error handling for MetaMask rejection
- [x] UI refreshes after successful stake 