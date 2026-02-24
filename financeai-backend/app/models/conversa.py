from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Conversa(Base):
    __tablename__ = "conversas"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    titulo = Column(String, nullable=True) # Ex: "Resumo de Janeiro"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    mensagens = relationship("Mensagem", back_populates="conversa", cascade="all, delete-orphan")
    user = relationship("User")

class Mensagem(Base):
    __tablename__ = "mensagens"

    id = Column(Integer, primary_key=True, index=True)
    conversa_id = Column(Integer, ForeignKey("conversas.id"), nullable=False, index=True)
    role = Column(String, nullable=False) # "user" ou "assistant"
    content = Column(Text, nullable=False)
    fontes = Column(JSONB, nullable=True) # Guardar infos das fontes consultadas
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversa = relationship("Conversa", back_populates="mensagens")
