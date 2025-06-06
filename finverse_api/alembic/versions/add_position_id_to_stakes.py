"""add position_id to stakes table for staking position linking

Revision ID: add_position_id_stakes
Revises: add_staking_positions
Create Date: 2025-01-20 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_position_id_stakes'
down_revision: Union[str, None] = 'add_staking_positions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add position_id column to stakes table to link with staking_positions"""
    # Add position_id column to stakes table
    op.add_column('stakes', 
        sa.Column('position_id', sa.BigInteger(), nullable=True, 
                 comment='Reference to staking position'))
    
    # Add index for position_id
    op.create_index('idx_stakes_position_id', 'stakes', ['position_id'])
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_stakes_position_id', 
        'stakes', 
        'staking_positions', 
        ['position_id'], 
        ['id'],
        ondelete='SET NULL'
    )
    
    print("✅ Added position_id column to stakes table")
    print("✅ Added index and foreign key constraint for position linking")


def downgrade() -> None:
    """Remove position_id column from stakes table"""
    # Drop foreign key constraint
    op.drop_constraint('fk_stakes_position_id', 'stakes', type_='foreignkey')
    
    # Drop index
    op.drop_index('idx_stakes_position_id', 'stakes')
    
    # Drop column
    op.drop_column('stakes', 'position_id')
    
    print("✅ Removed position_id column from stakes table")
