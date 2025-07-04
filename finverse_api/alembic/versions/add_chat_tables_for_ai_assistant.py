"""add_chat_tables_for_ai_assistant

Revision ID: chat_tables_001
Revises: 35b5471ac6ce
Create Date: 2024-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'chat_tables_001'
down_revision = '35b5471ac6ce'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    
    # Create chat_sessions table
    op.create_table('chat_sessions',
        sa.Column('id', sa.BigInteger(), primary_key=True, index=True),
        sa.Column('title', sa.String(255), nullable=False, default='New Chat'),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for chat_sessions
    op.create_index('idx_chat_sessions_user_id', 'chat_sessions', ['user_id'])
    op.create_index('idx_chat_sessions_created_at', 'chat_sessions', ['created_at'])
    
    # Create chat_messages table
    op.create_table('chat_messages',
        sa.Column('id', sa.BigInteger(), primary_key=True, index=True),
        sa.Column('session_id', sa.BigInteger(), nullable=False),
        sa.Column('role', sa.Enum('user', 'assistant', 'system', name='chatrole'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('token_count', sa.Integer(), nullable=True),
        sa.Column('model_used', sa.String(100), nullable=True, default='gpt-3.5-turbo'),
        sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for chat_messages
    op.create_index('idx_chat_messages_session_id', 'chat_messages', ['session_id'])
    op.create_index('idx_chat_messages_created_at', 'chat_messages', ['created_at'])
    op.create_index('idx_chat_messages_role', 'chat_messages', ['role'])
    
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    
    # Drop chat_messages table and its indexes
    op.drop_index('idx_chat_messages_role', table_name='chat_messages')
    op.drop_index('idx_chat_messages_created_at', table_name='chat_messages')
    op.drop_index('idx_chat_messages_session_id', table_name='chat_messages')
    op.drop_table('chat_messages')
    
    # Drop chat_sessions table and its indexes
    op.drop_index('idx_chat_sessions_created_at', table_name='chat_sessions')
    op.drop_index('idx_chat_sessions_user_id', table_name='chat_sessions')
    op.drop_table('chat_sessions')
    
    # Drop the enum type
    op.execute("DROP TYPE IF EXISTS chatrole")
    
    # ### end Alembic commands ### 