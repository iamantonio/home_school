"""add assessment tables

Revision ID: a5c3cf0d1d37
Revises: 24f61150ba75
Create Date: 2025-12-02 14:51:29.526606

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a5c3cf0d1d37'
down_revision: Union[str, Sequence[str], None] = '24f61150ba75'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'assessments',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('objective_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('learning_objectives.id'), nullable=False),
        sa.Column('student_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('student_profiles.id'), nullable=False),
        sa.Column('status', sa.String(50), default='not_started'),
        sa.Column('score', sa.Float, nullable=True),
        sa.Column('passed_without_hints', sa.Boolean, default=False),
        sa.Column('completed_at', sa.Date, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        'questions',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('assessment_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('assessments.id'), nullable=False),
        sa.Column('question_type', sa.String(50), nullable=False),
        sa.Column('question_text', sa.Text, nullable=False),
        sa.Column('options', postgresql.JSONB, nullable=True),
        sa.Column('correct_answer', sa.Text, nullable=False),
        sa.Column('hint_1', sa.Text, nullable=True),
        sa.Column('hint_2', sa.Text, nullable=True),
        sa.Column('order', sa.Integer, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        'responses',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('question_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('questions.id'), nullable=False),
        sa.Column('student_answer', sa.Text, nullable=False),
        sa.Column('is_correct', sa.Boolean, nullable=False),
        sa.Column('hints_used', sa.Integer, default=0),
        sa.Column('ai_feedback', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        'mastery_attempts',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('student_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('student_profiles.id'), nullable=False),
        sa.Column('objective_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('learning_objectives.id'), nullable=False),
        sa.Column('assessment_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('assessments.id'), nullable=False),
        sa.Column('passed_clean', sa.Boolean, nullable=False),
        sa.Column('attempt_date', sa.Date, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('mastery_attempts')
    op.drop_table('responses')
    op.drop_table('questions')
    op.drop_table('assessments')
