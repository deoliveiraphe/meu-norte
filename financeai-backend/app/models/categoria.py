from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True, nullable=False)
    tipo = Column(String, nullable=False) # 'receita' ou 'despesa'
    cor_hexa = Column(String, nullable=True) # opcional, ex: #FF0000
    icone = Column(String, nullable=True) # opcional emoji
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lancamentos = relationship("Lancamento", back_populates="categoria")
