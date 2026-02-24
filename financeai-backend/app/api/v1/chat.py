import json
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.db.session import get_db, AsyncSessionLocal
from app.api.deps import get_current_user
from app.core.websocket import manager
from app.models.conversa import Conversa, Mensagem
from app.schemas.chat import ConversaResponse, ConversaCreate
from app.services.rag.pipeline import interagir_com_chat_ws
from jose import jwt, JWTError
from app.config import settings
from app.models.user import User

router = APIRouter()

# --- WS Dependencies Mock Helper ---
# WebSocket Auth: The token should be passed by query_params for WS: ws://...?token=xyz
async def get_ws_current_user(token: str, db: AsyncSession) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        result = await db.execute(select(User).filter(User.email == email))
        return result.scalars().first()
    except JWTError:
        return None

# ==== ROTAS REST P/ HISTORICO ====
@router.post("/conversas", response_model=ConversaResponse)
async def criar_conversa(
    conversa_in: ConversaCreate, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    nova_conversa = Conversa(user_id=current_user.id, titulo=conversa_in.titulo or "Nova Conversa")
    db.add(nova_conversa)
    await db.commit()
    await db.refresh(nova_conversa)
    return nova_conversa

@router.get("/conversas", response_model=List[ConversaResponse])
async def listar_conversas(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Conversa)
        .options(selectinload(Conversa.mensagens))
        .filter(Conversa.user_id == current_user.id)
        .order_by(Conversa.updated_at.desc())
    )
    return result.scalars().all()

@router.get("/conversas/{conversa_id}", response_model=ConversaResponse)
async def detalhar_conversa(
    conversa_id: int, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Conversa)
        .options(selectinload(Conversa.mensagens))
        .filter(Conversa.id == conversa_id, Conversa.user_id == current_user.id)
    )
    conversa = result.scalars().first()
    if not conversa:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    return conversa

@router.delete("/conversas/{conversa_id}")
async def deletar_conversa(
    conversa_id: int, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Conversa).filter(Conversa.id == conversa_id, Conversa.user_id == current_user.id))
    conversa = result.scalars().first()
    if not conversa:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    await db.delete(conversa)
    await db.commit()
    return {"status": "ok"}


# ==== ROTA WEBSOCKET ====
@router.websocket("/ws/{conversa_id}")
async def chat_websocket(websocket: WebSocket, conversa_id: int, token: str):
    async with AsyncSessionLocal() as db:
        user = await get_ws_current_user(token, db)
        if not user:
            await websocket.close(code=1008, reason="Token inválido")
            return
            
        conversa_result = await db.execute(select(Conversa).filter(Conversa.id == conversa_id, Conversa.user_id == user.id))
        conversa = conversa_result.scalars().first()
        if not conversa:
            await websocket.close(code=1008, reason="Conversa não encontrada")
            return

        client_id = f"{user.id}_{conversa_id}"
        await manager.connect(websocket, client_id)
        
        try:
            while True:
                data = await websocket.receive_text()
                # Parse in data (user prompt)
                payload = json.loads(data)
                pergunta = payload.get("message", "")
                if not pergunta:
                    continue
                    
                # 1. Salvar mensagem do user db
                msg_user = Mensagem(conversa_id=conversa_id, role="user", content=pergunta)
                db.add(msg_user)
                await db.commit()
                
                # 2. Chama pipeline RAG que vai STREAMAR no websocket
                resposta_assistente = await interagir_com_chat_ws(
                    pergunta=pergunta,
                    user_id=user.id,
                    conversa_id=conversa_id,
                    websocket=websocket,
                    db=db
                )
                
                # 3. Salvar resposta final do assistente no DB
                msg_assistente = Mensagem(conversa_id=conversa_id, role="assistant", content=resposta_assistente)
                db.add(msg_assistente)
                await db.commit()
                
        except WebSocketDisconnect:
            manager.disconnect(client_id)
        except Exception as e:
            manager.disconnect(client_id)
            print(f"WS Error: {e}")
