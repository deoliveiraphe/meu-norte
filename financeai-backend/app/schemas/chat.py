from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class MensagemBase(BaseModel):
    role: str
    content: str
    fontes: Optional[Any] = None

class MensagemResponse(MensagemBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConversaBase(BaseModel):
    titulo: Optional[str] = None

class ConversaCreate(ConversaBase):
    pass

class ConversaResponse(ConversaBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    mensagens: List[MensagemResponse] = []
    
    class Config:
        from_attributes = True
