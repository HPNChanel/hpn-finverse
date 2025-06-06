"""add staking_positions table for enhanced staking with frontend sync

Revision ID: add_staking_positions
Revises: add_is_hidden_accounts
Create Date: 2025-01-20 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_staking_positions'
down_revision: Union[str, None] = 'add_is_hidden_accounts'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add staking_positions table for enhanced staking functionality."""
    # Create staking_positions table
    op.create_table('staking_positions',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.BigInteger(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('pool_id', sa.String(50), nullable=False, index=True, comment='Staking pool identifier'),
        sa.Column('amount', sa.DECIMAL(18, 8), nullable=False, comment='Staked amount with crypto precision'),
        sa.Column('staked_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp(), comment='When the stake was created'),
        sa.Column('lock_period', sa.Integer(), nullable=False, default=0, comment='Lock period in days'),
        sa.Column('reward_rate', sa.DECIMAL(5, 4), nullable=False, default=0.0000, comment='Annual reward rate as percentage'),
        sa.Column('tx_hash', sa.String(100), nullable=True, unique=True, comment='Blockchain transaction hash'),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True, comment='Whether stake is currently active'),
        sa.Column('unlock_date', sa.DateTime(), nullable=True, comment='When stake can be withdrawn'),
        sa.Column('rewards_earned', sa.DECIMAL(18, 8), nullable=False, default=0.00000000, comment='Total rewards earned'),
        sa.Column('last_reward_calculation', sa.DateTime(), nullable=True, comment='Last time rewards were calculated'),
        sa.Column('status', sa.String(20), nullable=False, default='ACTIVE', comment='Stake status'),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp(), onupdate=sa.func.current_timestamp()),
        
        # Indexes for performance
        sa.Index('idx_staking_positions_user_id', 'user_id'),
        sa.Index('idx_staking_positions_pool_id', 'pool_id'),
        sa.Index('idx_staking_positions_status', 'status'),
        sa.Index('idx_staking_positions_is_active', 'is_active'),
        sa.Index('idx_staking_positions_staked_at', 'staked_at'),
        
        # Foreign key constraints
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        
        comment='Enhanced staking positions for frontend sync support'
    )
    
    print("✅ Created staking_positions table with enhanced staking functionality")
    print("✅ Added indexes for optimal query performance")
    print("✅ Added foreign key constraint to users table")


def downgrade() -> None:
    """Remove staking_positions table."""
    op.drop_table('staking_positions')
    print("✅ Dropped staking_positions table")
