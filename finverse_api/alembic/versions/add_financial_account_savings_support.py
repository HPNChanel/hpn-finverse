"""Add financial account support to savings plans

Revision ID: add_financial_account_savings_support
Revises: 444454883e40
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_fin_acct_savings'
down_revision: Union[str, None] = '444454883e40'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add source_account_id to savings_plans table
    with op.batch_alter_table('savings_plans', schema=None) as batch_op:
        batch_op.add_column(sa.Column('source_account_id', sa.BigInteger(), nullable=True, comment='Financial account from which money is deducted'))
        batch_op.create_index(batch_op.f('ix_savings_plans_source_account_id'), ['source_account_id'], unique=False)
        batch_op.create_foreign_key('fk_savings_plans_source_account_id', 'financial_accounts', ['source_account_id'], ['id'])

    # Add source_account_id and destination_account_id to transactions table
    with op.batch_alter_table('transactions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('source_account_id', sa.BigInteger(), nullable=True, comment='Source account for the transaction (especially for savings)'))
        batch_op.add_column(sa.Column('destination_account_id', sa.BigInteger(), nullable=True, comment='Destination account for the transaction (for withdrawals/transfers)'))
        batch_op.create_index(batch_op.f('ix_transactions_source_account_id'), ['source_account_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_transactions_destination_account_id'), ['destination_account_id'], unique=False)
        batch_op.create_foreign_key('fk_transactions_source_account_id', 'financial_accounts', ['source_account_id'], ['id'])
        batch_op.create_foreign_key('fk_transactions_destination_account_id', 'financial_accounts', ['destination_account_id'], ['id'])

    # Set source_account_id to NOT NULL after data migration (in a future step)
    # For now, we'll make it nullable to allow existing data to exist


def downgrade() -> None:
    """Downgrade schema."""
    # Remove foreign keys and columns from transactions table
    with op.batch_alter_table('transactions', schema=None) as batch_op:
        batch_op.drop_constraint('fk_transactions_destination_account_id', type_='foreignkey')
        batch_op.drop_constraint('fk_transactions_source_account_id', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_transactions_destination_account_id'))
        batch_op.drop_index(batch_op.f('ix_transactions_source_account_id'))
        batch_op.drop_column('destination_account_id')
        batch_op.drop_column('source_account_id')

    # Remove source_account_id from savings_plans table
    with op.batch_alter_table('savings_plans', schema=None) as batch_op:
        batch_op.drop_constraint('fk_savings_plans_source_account_id', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_savings_plans_source_account_id'))
        batch_op.drop_column('source_account_id') 