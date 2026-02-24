from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from sqlalchemy.sql import func
from app.db.base import Base

class FinanceEmbedding(Base):
    __tablename__ = "finance_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    lancamento_id = Column(Integer, ForeignKey("lancamentos.id"), nullable=True, unique=True)
    
    conteudo = Column(Text, nullable=False)
    embedding = Column(Vector(768), nullable=False) # pgvector com nomic-embed-text
    metadata_ = Column("metadata", JSONB, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    lancamento = relationship("Lancamento", back_populates="embedding")
