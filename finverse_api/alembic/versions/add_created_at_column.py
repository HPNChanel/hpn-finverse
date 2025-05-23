"""Add created_at column to budget_plans

Revision ID: add_created_at_column
Revises: 3fcdbd29275e
Create Date: 2025-05-24 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision: str = 'add_created_at_column'
down_revision: Union[str, None] = '3fcdbd29275e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add created_at column with default value of current timestamp
    op.add_column('budget_plans', sa.Column('created_at', sa.DateTime(), 
                   nullable=False, 
                   server_default=sa.func.now()))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove created_at column if migration is rolled back
    op.drop_column('budget_plans', 'created_at')
