# FinVerse API

A FastAPI backend for a financial dApp with a virtual account system.

## Features

- User authentication
- Staking functionality
- Transaction management
- Virtual financial account system
  - Create and manage multiple virtual accounts
  - Transfer funds between accounts
  - Budget planning and tracking

## Setup and Installation

1. Create a MySQL database named `finverse_db`

2. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

3. Run the API:
   ```
   cd finverse_api
   uvicorn app.main:app --reload
   ```

4. The API will be available at http://localhost:8000
   - Swagger documentation: http://localhost:8000/docs

## Virtual Account System API Endpoints

### Financial Accounts

- `POST /accounts/create`: Create a new virtual account
- `GET /accounts/list`: List all accounts of current user

### Internal Transfers

- `POST /accounts/transfer`: Transfer funds between accounts
- `GET /accounts/transactions`: List all internal transfers for a user

### Budget Planning

- `POST /budget/create`: Create a budget limit
- `PATCH /budget/update_spending`: Update spending of a budget
- `GET /budget/list/{account_id}`: List all budget plans per account

### Transactions

- `POST /transactions/create`: Create a new transaction (now accepts `category` as string field)
- `GET /transactions/history`: Get transaction history for the current user
- `GET /transactions/{transaction_id}`: Get details of a specific transaction

## Database Structure

The virtual account system uses the following database tables:
- `financial_accounts`: Stores virtual account information
- `internal_transactions`: Records transfers between accounts
- `budget_plans`: Tracks spending limits and categories
- `transactions`: Records all financial transactions (now using direct category string)

## Notes

This implementation uses MySQL for data storage, with SQLAlchemy as the ORM.