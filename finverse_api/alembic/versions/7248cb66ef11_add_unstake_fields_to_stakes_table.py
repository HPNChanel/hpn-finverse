"""Add unstake fields to stakes table

Revision ID: 7248cb66ef11
Revises: 
Create Date: 2025-06-08 18:00:44.494894

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7248cb66ef11'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add unstaked_at column
    op.add_column('stakes', sa.Column('unstaked_at', sa.DateTime(), nullable=True, comment='When the stake was withdrawn'))
    
    # Add unstake_tx_hash column
    op.add_column('stakes', sa.Column('unstake_tx_hash', sa.String(100), nullable=True, unique=True, comment='Unstake transaction hash'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('stakes', 'unstake_tx_hash')
    op.drop_column('stakes', 'unstaked_at')
