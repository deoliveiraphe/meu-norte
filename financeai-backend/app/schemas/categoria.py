from pydantic import BaseModel
from typing import Optional

class CategoriaBase(BaseModel):
    nome: str
    tipo: str  # 'receita' ou 'despesa'
    icone: Optional[str] = "🏷️"

class CategoriaCreate(CategoriaBase):
    pass

class CategoriaUpdate(BaseModel):
    nome: Optional[str] = None
    tipo: Optional[str] = None
    icone: Optional[str] = None

class CategoriaResponse(CategoriaBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
