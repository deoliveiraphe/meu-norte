from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.lancamento import Lancamento
from app.schemas.lancamento import LancamentoCreate, LancamentoResponse, LancamentoUpdate
from app.services.tasks.indexing import indexar_lancamento

router = APIRouter()

@router.post("/", response_model=LancamentoResponse)
async def criar_lancamento(
    lancamento_in: LancamentoCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    db_obj = Lancamento(**lancamento_in.model_dump(), user_id=current_user.id)
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)

    # Buscar com a Categoria populada para o ResponseModel do FastAPI (Pydantic) não quebrar
    result = await db.execute(
        select(Lancamento)
        .options(joinedload(Lancamento.categoria))
        .filter(Lancamento.id == db_obj.id)
    )
    db_obj_loaded = result.scalars().first()

    # Dispara a indexacao de embeddings no Celery de forma assíncrona
    indexar_lancamento.delay(db_obj.id, current_user.id)

    return db_obj_loaded


@router.get("/", response_model=List[LancamentoResponse])
async def listar_lancamentos(
    skip: int = 0,
    limit: int = 1000,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Lancamento)
        .options(joinedload(Lancamento.categoria))
        .filter(Lancamento.user_id == current_user.id)
        .order_by(Lancamento.data_vencimento.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

@router.put("/{lancamento_id}", response_model=LancamentoResponse)
async def atualizar_lancamento(
    lancamento_id: int,
    lancamento_in: LancamentoUpdate,
    update_all: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Lancamento)
        .options(joinedload(Lancamento.categoria))
        .filter(
            Lancamento.id == lancamento_id,
            Lancamento.user_id == current_user.id
        )
    )
    db_obj = result.scalars().first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Lançamento não encontrado")

    update_data = lancamento_in.model_dump(exclude_unset=True)
    
    if update_all and db_obj.parcela_group_id:
        group_result = await db.execute(
            select(Lancamento)
            .filter(
                Lancamento.parcela_group_id == db_obj.parcela_group_id,
                Lancamento.user_id == current_user.id
            )
        )
        group_objs = group_result.scalars().all()
        
        # Ignora datas para não encavalar todos os meses das parcelas no mesmo dia
        update_data.pop("data_vencimento", None)
        update_data.pop("data_pagamento", None)
        
        for obj in group_objs:
            for field, value in update_data.items():
                setattr(obj, field, value)
            # Agenda re-indexação de tudo do grupo
            indexar_lancamento.delay(obj.id, current_user.id)
    else:
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        indexar_lancamento.delay(db_obj.id, current_user.id)

    await db.commit()
    await db.refresh(db_obj)

    # Recarrega categoria pós-refresh
    result = await db.execute(
        select(Lancamento)
        .options(joinedload(Lancamento.categoria))
        .filter(Lancamento.id == db_obj.id)
    )
    db_obj_loaded = result.scalars().first()

    # A re-indexação já foi chamada no loop acima

    
    return db_obj_loaded

@router.delete("/{lancamento_id}")
async def remover_lancamento(
    lancamento_id: int,
    delete_all: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Lancamento).filter(
            Lancamento.id == lancamento_id,
            Lancamento.user_id == current_user.id
        )
    )
    db_obj = result.scalars().first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Lançamento não encontrado")

    if delete_all and db_obj.parcela_group_id:
        group_result = await db.execute(
            select(Lancamento)
            .filter(
                Lancamento.parcela_group_id == db_obj.parcela_group_id,
                Lancamento.user_id == current_user.id
            )
        )
        group_objs = group_result.scalars().all()
        for obj in group_objs:
            await db.delete(obj)
    else:
        await db.delete(db_obj)

    # Obs: a relationship cascade "deveria/poderia" excluir o FinanceEmbedding, 
    # porém vamos gerenciar com Celery caso seja necessário depois.
    await db.commit()
    return {"status": "ok", "detail": "Lançamento(s) removido(s)"}
