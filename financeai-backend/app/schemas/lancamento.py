from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

# ==== CATEGORIA ====
class CategoriaBase(BaseModel):
    nome: str
    tipo: str
    cor_hexa: Optional[str] = None
    icone: Optional[str] = None

class CategoriaResponse(CategoriaBase):
    id: int
    
    class Config:
        from_attributes = True

# ==== LANCAMENTO ====
class LancamentoBase(BaseModel):
    tipo: str # receita ou despesa
    descricao: str
    valor: Decimal
    data_vencimento: date
    data_pagamento: Optional[date] = None
    is_pago: bool = False
    observacoes: Optional[str] = None
    categoria_id: int
    parcela_group_id: Optional[str] = None

class LancamentoCreate(LancamentoBase):
    pass

class LancamentoUpdate(BaseModel):
    descricao: Optional[str] = None
    valor: Optional[Decimal] = None
    data_vencimento: Optional[date] = None
    data_pagamento: Optional[date] = None
    is_pago: Optional[bool] = None
    observacoes: Optional[str] = None
    categoria_id: Optional[int] = None
    parcela_group_id: Optional[str] = None

class LancamentoResponse(LancamentoBase):
    id: int
    user_id: int
    created_at: datetime
    categoria: Optional[CategoriaResponse] = None

    class Config:
        from_attributes = True
