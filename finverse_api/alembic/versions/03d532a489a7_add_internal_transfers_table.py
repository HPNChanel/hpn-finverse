"""add_internal_transfers_table

Revision ID: 03d532a489a7
Revises: 7248cb66ef11
Create Date: 2025-06-08 18:20:36.111715

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '03d532a489a7'
down_revision: Union[str, None] = '7248cb66ef11'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create internal_transfers table for ETH transfer logging
    op.create_table('internal_transfers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('from_address', sa.String(length=42), nullable=False),
        sa.Column('to_address', sa.String(length=42), nullable=False),
        sa.Column('amount_eth', sa.Numeric(precision=20, scale=8), nullable=False),
        sa.Column('tx_hash', sa.String(length=66), nullable=True),
        sa.Column('gas_used', sa.String(length=20), nullable=True),
        sa.Column('gas_price', sa.String(length=30), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='success'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_internal_transfers_id'), 'internal_transfers', ['id'], unique=False)
    op.create_index(op.f('ix_internal_transfers_from_address'), 'internal_transfers', ['from_address'], unique=False)
    op.create_index(op.f('ix_internal_transfers_to_address'), 'internal_transfers', ['to_address'], unique=False)
    op.create_index(op.f('ix_internal_transfers_tx_hash'), 'internal_transfers', ['tx_hash'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop internal_transfers table
    op.drop_index(op.f('ix_internal_transfers_tx_hash'), table_name='internal_transfers')
    op.drop_index(op.f('ix_internal_transfers_to_address'), table_name='internal_transfers')
    op.drop_index(op.f('ix_internal_transfers_from_address'), table_name='internal_transfers')
    op.drop_index(op.f('ix_internal_transfers_id'), table_name='internal_transfers')
    op.drop_table('internal_transfers')
