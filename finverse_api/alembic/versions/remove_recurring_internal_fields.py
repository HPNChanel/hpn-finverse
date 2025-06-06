"""remove recurring and internal transaction fields

Revision ID: remove_recurring_internal_fields
Revises: unified_stake_model
Create Date: 2025-01-20 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'remove_recurring_internal_fields'
down_revision: Union[str, None] = 'unified_stake_model'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove recurring and internal transaction fields from transactions table"""
    
    # Check if columns exist before dropping them
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    
    columns = [col['name'] for col in inspector.get_columns('transactions')]
    
    # Drop recurring transaction fields
    recurring_fields = ['is_recurring', 'recurring_interval', 'next_due_date', 'recurring_end_date']
    for field in recurring_fields:
        if field in columns:
            op.drop_column('transactions', field)
            print(f"✅ Dropped column: {field}")
    
    # Drop internal transaction fields
    internal_fields = ['is_internal', 'internal_to_account_id', 'internal_note']
    for field in internal_fields:
        if field in columns:
            # Drop foreign key constraint for internal_to_account_id if it exists
            if field == 'internal_to_account_id':
                try:
                    op.drop_constraint('fk_transactions_internal_to_account_id', 'transactions', type_='foreignkey')
                except:
                    pass  # Constraint might not exist
            
            op.drop_column('transactions', field)
            print(f"✅ Dropped column: {field}")
    
    print("✅ Successfully removed all recurring and internal transaction fields")
    print("✅ Transaction model now contains only core transaction fields")


def downgrade() -> None:
    """Restore recurring and internal transaction fields"""
    
    # Add back recurring transaction fields
    op.add_column('transactions', 
                  sa.Column('is_recurring', sa.Boolean(), nullable=False, default=False, 
                           comment="Whether this is a recurring transaction"))
    
    op.add_column('transactions', 
                  sa.Column('recurring_interval', sa.String(50), nullable=True, 
                           comment="Recurring interval: daily, weekly, monthly, yearly"))
    
    op.add_column('transactions', 
                  sa.Column('next_due_date', sa.Date(), nullable=True, 
                           comment="Next scheduled date for recurring transaction"))
    
    op.add_column('transactions', 
                  sa.Column('recurring_end_date', sa.Date(), nullable=True, 
                           comment="When recurring ends (null = indefinite)"))
    
    # Add back internal transaction fields
    op.add_column('transactions', 
                  sa.Column('is_internal', sa.Boolean(), nullable=False, default=False, 
                           comment="Whether this is an internal transfer"))
    
    op.add_column('transactions', 
                  sa.Column('internal_to_account_id', sa.BigInteger(), 
                           sa.ForeignKey("financial_accounts.id"), nullable=True, 
                           comment="Target account for internal transfers"))
    
    op.add_column('transactions', 
                  sa.Column('internal_note', sa.Text(), nullable=True, 
                           comment="Additional note for internal transfers"))
    
    print("✅ Restored recurring and internal transaction fields")
