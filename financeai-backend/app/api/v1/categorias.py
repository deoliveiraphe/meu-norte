from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.categoria import Categoria
from app.models.lancamento import Lancamento
from app.schemas.categoria import CategoriaCreate, CategoriaUpdate, CategoriaResponse

router = APIRouter()

@router.get("/", response_model=List[CategoriaResponse])
async def listar_categorias(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Categoria)
        .filter(Categoria.user_id == current_user.id)
        .order_by(Categoria.nome)
    )
    return result.scalars().all()

@router.post("/", response_model=CategoriaResponse, status_code=201)
async def criar_categoria(
    categoria_in: CategoriaCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Validar duplicidade de nome
    result = await db.execute(
        select(Categoria).filter(
            Categoria.user_id == current_user.id,
            Categoria.nome == categoria_in.nome,
            Categoria.tipo == categoria_in.tipo
        )
    )
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Você já possui uma categoria com este nome e tipo.")

    nova_categoria = Categoria(
        nome=categoria_in.nome,
        tipo=categoria_in.tipo,
        icone=categoria_in.icone,
        user_id=current_user.id
    )
    db.add(nova_categoria)
    await db.commit()
    await db.refresh(nova_categoria)
    return nova_categoria

@router.put("/{cat_id}", response_model=CategoriaResponse)
async def atualizar_categoria(
    cat_id: int,
    categoria_in: CategoriaUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Categoria).filter(Categoria.id == cat_id, Categoria.user_id == current_user.id))
    categoria = result.scalars().first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")

    # Se mudar o nome, precisa checar colisao
    if categoria_in.nome is not None and categoria_in.nome != categoria.nome:
        check = await db.execute(
            select(Categoria).filter(
                Categoria.user_id == current_user.id,
                Categoria.nome == categoria_in.nome,
                Categoria.tipo == categoria.tipo
            )
        )
        if check.scalars().first():
            raise HTTPException(status_code=400, detail="Você já possui uma categoria com este nome e tipo.")

    for field, value in categoria_in.model_dump(exclude_unset=True).items():
        setattr(categoria, field, value)

    await db.commit()
    await db.refresh(categoria)
    return categoria

@router.delete("/{cat_id}", status_code=204)
async def excluir_categoria(
    cat_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Categoria).filter(Categoria.id == cat_id, Categoria.user_id == current_user.id))
    categoria = result.scalars().first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")

    # Proteção: Não deletar categoria se possuir lançamentos "órfãos" (Integridade)
    result_lancs = await db.execute(select(Lancamento).filter(Lancamento.categoria_id == cat_id).limit(1))
    if result_lancs.scalars().first():
        raise HTTPException(
            status_code=400, 
            detail="Não é possível excluir esta Categoria, pois existem Lançamentos vinculados a ela."
        )

    await db.delete(categoria)
    await db.commit()
    return None
