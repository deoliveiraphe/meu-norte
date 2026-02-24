from sqlalchemy import Column, Integer, String, Numeric, Date, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base

class TipoLancamento(str, enum.Enum):
    RECEITA = "receita"
    DESPESA = "despesa"

class Lancamento(Base):
    __tablename__ = "lancamentos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=False, index=True)
    
    tipo = Column(String, nullable=False) # "receita" ou "despesa" (idealmente usar Enum)
    descricao = Column(String, nullable=False)
    valor = Column(Numeric(10, 2), nullable=False)
    data_vencimento = Column(Date, nullable=False, index=True)
    data_pagamento = Column(Date, nullable=True)
    is_pago = Column(Boolean, default=False)
    observacoes = Column(String, nullable=True)
    parcela_group_id = Column(String, nullable=True, index=True) # Agrupa lançamentos criados juntos

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User")
    categoria = relationship("Categoria", back_populates="lancamentos")
    embedding = relationship("FinanceEmbedding", back_populates="lancamento", uselist=False)
