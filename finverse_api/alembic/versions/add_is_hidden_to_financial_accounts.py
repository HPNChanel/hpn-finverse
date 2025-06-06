"""add is_hidden column to financial_accounts

Revision ID: add_is_hidden_accounts
Revises: 820c535947a6
Create Date: 2025-01-20 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_is_hidden_accounts'
down_revision: Union[str, None] = '820c535947a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add is_hidden column to financial_accounts table."""
    # Add is_hidden column with default False
    op.add_column('financial_accounts', 
                  sa.Column('is_hidden', 
                           sa.Boolean(), 
                           nullable=False, 
                           default=False,
                           comment="Whether the account is hidden from balance calculations"))
    
    # Set default value for existing records
    op.execute("UPDATE financial_accounts SET is_hidden = FALSE WHERE is_hidden IS NULL")


def downgrade() -> None:
    """Remove is_hidden column from financial_accounts table."""
    op.drop_column('financial_accounts', 'is_hidden')
