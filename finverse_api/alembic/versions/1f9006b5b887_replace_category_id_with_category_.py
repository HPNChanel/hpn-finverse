"""Replace category_id with category string in transactions

Revision ID: 1f9006b5b887
Revises: ae9824cd1569
Create Date: 2025-05-15 10:32:50.894977

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1f9006b5b887'
down_revision: Union[str, None] = 'ae9824cd1569'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # First add the new column (nullable to allow transition)
    op.add_column('transactions', sa.Column('category', sa.String(length=100), nullable=True))
    
    # Then drop the foreign key constraint
    op.drop_constraint('transactions_ibfk_2', 'transactions', type_='foreignkey')
    
    # Finally, drop the old column
    op.drop_column('transactions', 'category_id')


def downgrade() -> None:
    """Downgrade schema."""
    # First, add back the category_id column
    op.add_column('transactions', sa.Column('category_id', sa.Integer(), nullable=True))
    
    # Re-establish the foreign key constraint
    op.create_foreign_key('transactions_ibfk_2', 'transactions', 'categories', ['category_id'], ['id'])
    
    # Drop the category string column
    op.drop_column('transactions', 'category')
