"""Add user account balance table

Revision ID: 444454883e40
Revises: 7310648e4e5a
Create Date: 2025-06-15 11:49:20.629217

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '444454883e40'
down_revision: Union[str, None] = '7310648e4e5a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create user_account_balances table
    op.create_table('user_account_balances',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('total_balance', sa.DECIMAL(precision=18, scale=8), nullable=False, server_default='0.00000000', comment='Total available balance for savings and operations'),
        sa.Column('currency', sa.String(length=10), nullable=False, server_default='USD'),
        sa.Column('last_updated', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.UniqueConstraint('user_id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_user_account_balances_id'), 'user_account_balances', ['id'], unique=False)
    op.create_index(op.f('ix_user_account_balances_user_id'), 'user_account_balances', ['user_id'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes
    op.drop_index(op.f('ix_user_account_balances_user_id'), table_name='user_account_balances')
    op.drop_index(op.f('ix_user_account_balances_id'), table_name='user_account_balances')
    
    # Drop table
    op.drop_table('user_account_balances') 