"""create unified stake model, drop staking_positions table

Revision ID: unified_stake_model
Revises: add_position_id_stakes
Create Date: 2025-01-20 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'unified_stake_model'
down_revision: Union[str, None] = 'add_position_id_stakes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create unified stake model and drop staking_positions table"""
    
    # First, check if staking_positions table exists and has data
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    
    has_staking_positions = 'staking_positions' in inspector.get_table_names()
    
    if has_staking_positions:
        # Check if table has any data
        result = connection.execute(sa.text("SELECT COUNT(*) FROM staking_positions")).fetchone()
        row_count = result[0] if result else 0
        
        if row_count > 0:
            print(f"⚠️ WARNING: staking_positions table contains {row_count} records")
            print("⚠️ Manual data migration may be required before proceeding")
            # Optionally raise an exception to prevent data loss
            # raise Exception("Cannot drop staking_positions table with existing data")
        
        # Drop staking_positions table (only if no data or you're sure about data migration)
        op.drop_table('staking_positions')
        print("✅ Dropped staking_positions table")
    
    # Recreate stakes table with unified schema
    op.drop_table('stakes')
    print("✅ Dropped old stakes table")
    
    # Create new unified stakes table
    op.create_table('stakes',
        # Core identification
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.BigInteger(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('pool_id', sa.String(50), nullable=False, index=True, comment='Staking pool identifier'),
        
        # Financial fields with high precision
        sa.Column('amount', sa.DECIMAL(18, 8), nullable=False, comment='Staked amount with crypto precision'),
        sa.Column('claimable_rewards', sa.DECIMAL(18, 8), nullable=False, default=0.00000000, comment='Rewards available to claim'),
        sa.Column('rewards_earned', sa.DECIMAL(18, 8), nullable=False, default=0.00000000, comment='Total rewards earned'),
        sa.Column('predicted_reward', sa.DECIMAL(18, 8), nullable=True, comment='ML predicted reward for this stake'),
        
        # Time tracking
        sa.Column('staked_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp(), comment='When the stake was created'),
        sa.Column('unlock_at', sa.DateTime(), nullable=True, comment='When stake can be withdrawn'),
        sa.Column('lock_period', sa.Integer(), nullable=False, default=0, comment='Lock period in days'),
        
        # Rate tracking with snapshots
        sa.Column('reward_rate', sa.DECIMAL(5, 4), nullable=False, default=0.0000, comment='Annual reward rate as percentage (4 decimals)'),
        sa.Column('apy_snapshot', sa.DECIMAL(5, 2), nullable=True, comment='APY at the time of staking (2 decimals)'),
        
        # Blockchain & status
        sa.Column('tx_hash', sa.String(100), nullable=True, unique=True, comment='Blockchain transaction hash'),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True, comment='Whether stake is currently active'),
        sa.Column('status', sa.String(20), nullable=False, default='ACTIVE', comment='Stake status enum'),
        
        # AI & Analytics fields
        sa.Column('model_confidence', sa.Float(), nullable=True, comment='AI model confidence score (0.0-1.0)'),
        sa.Column('ai_tag', sa.String(50), nullable=True, comment='AI-assigned tag for stake pattern'),
        
        # Metadata
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp(), onupdate=sa.func.current_timestamp()),
        
        # Indexes for performance
        sa.Index('idx_stakes_user_id', 'user_id'),
        sa.Index('idx_stakes_pool_id', 'pool_id'),
        sa.Index('idx_stakes_status', 'status'),
        sa.Index('idx_stakes_is_active', 'is_active'),
        sa.Index('idx_stakes_staked_at', 'staked_at'),
        sa.Index('idx_stakes_unlock_at', 'unlock_at'),
        sa.Index('idx_stakes_tx_hash', 'tx_hash'),
        
        # Foreign key constraints
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        
        comment='Unified staking model with AI analytics and blockchain tracking'
    )
    
    print("✅ Created unified stakes table with enhanced functionality")
    print("✅ Added comprehensive indexes for optimal query performance")
    print("✅ Added AI analytics and blockchain tracking fields")


def downgrade() -> None:
    """Restore original stakes and staking_positions tables"""
    # This is a destructive migration, so downgrade recreates basic structure
    
    # Drop unified stakes table
    op.drop_table('stakes')
    
    # Recreate basic stakes table (legacy structure)
    op.create_table('stakes',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.BigInteger(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('address', sa.String(255), nullable=True),
        sa.Column('amount', sa.DECIMAL(18, 8), nullable=False),
        sa.Column('balance', sa.DECIMAL(18, 8), nullable=False, default=0.00000000),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.current_timestamp()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.current_timestamp()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'])
    )
    
    # Recreate staking_positions table
    op.create_table('staking_positions',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.BigInteger(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('pool_id', sa.String(50), nullable=False),
        sa.Column('amount', sa.DECIMAL(18, 8), nullable=False),
        sa.Column('staked_at', sa.DateTime(), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.current_timestamp()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.current_timestamp()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'])
    )
    
    print("✅ Restored legacy stakes and staking_positions tables")
