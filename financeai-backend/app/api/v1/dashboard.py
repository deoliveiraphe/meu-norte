from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from datetime import date, timedelta
from typing import Optional

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.lancamento import Lancamento
from app.models.categoria import Categoria
from app.schemas.dashboard import DashboardResumoStats, DashboardKPIs, CategoriaGasto, FluxoCaixaDia, ContaVencimento

router = APIRouter()

@router.get("/resumo", response_model=DashboardResumoStats)
async def obter_resumo_dashboard(
    mes: Optional[int] = Query(None, description="Mês 1-12"),
    ano: Optional[int] = Query(None, description="Ano"),
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    hoje = date.today()
    target_mes = mes or hoje.month
    target_ano = ano or hoje.year
    
    from calendar import monthrange
    _, last_day_atual = monthrange(target_ano, target_mes)
    inicio_mes_atual = date(target_ano, target_mes, 1)
    fim_mes_atual = date(target_ano, target_mes, last_day_atual)

    # Lógica de Mês Anterior
    if target_mes == 1:
        prev_mes = 12
        prev_ano = target_ano - 1
    else:
        prev_mes = target_mes - 1
        prev_ano = target_ano
        
    _, last_day_prev = monthrange(prev_ano, prev_mes)
    inicio_mes_prev = date(prev_ano, prev_mes, 1)
    fim_mes_prev = date(prev_ano, prev_mes, last_day_prev)

    # 1. Total Receitas e Despesas do Mês Atual
    stmt_atual = select(
        Lancamento.tipo, func.sum(Lancamento.valor).label("total")
    ).where(
        Lancamento.user_id == current_user.id,
        Lancamento.data_vencimento >= inicio_mes_atual,
        Lancamento.data_vencimento <= fim_mes_atual
    ).group_by(Lancamento.tipo)
    
    result_atual = await db.execute(stmt_atual)
    agrupado_atual = {row.tipo: float(row.total) for row in result_atual.all()}
    receita_mes = agrupado_atual.get("receita", 0.0)
    despesa_mes = agrupado_atual.get("despesa", 0.0)
    renegociacao_mes = agrupado_atual.get("renegociacao", 0.0)
    saldo_disponivel = receita_mes - despesa_mes
    taxa_poupanca = (saldo_disponivel / receita_mes * 100) if receita_mes > 0 else 0.0

    # 2. Total Receitas e Despesas do Mês Passado
    stmt_prev = select(
        Lancamento.tipo, func.sum(Lancamento.valor).label("total")
    ).where(
        Lancamento.user_id == current_user.id,
        Lancamento.data_vencimento >= inicio_mes_prev,
        Lancamento.data_vencimento <= fim_mes_prev
    ).group_by(Lancamento.tipo)
    
    result_prev = await db.execute(stmt_prev)
    agrupado_prev = {row.tipo: float(row.total) for row in result_prev.all()}
    receita_prev = agrupado_prev.get("receita", 0.0)
    despesa_prev = agrupado_prev.get("despesa", 0.0)
    renegociacao_prev = agrupado_prev.get("renegociacao", 0.0)

    # crescimentos %
    crescimento_receita_perc = ((receita_mes - receita_prev) / receita_prev * 100) if receita_prev > 0 else (100.0 if receita_mes > 0 else 0.0)
    crescimento_despesa_perc = ((despesa_mes - despesa_prev) / despesa_prev * 100) if despesa_prev > 0 else (100.0 if despesa_mes > 0 else 0.0)
    crescimento_renegociacao_perc = ((renegociacao_mes - renegociacao_prev) / renegociacao_prev * 100) if renegociacao_prev > 0 else (100.0 if renegociacao_mes > 0 else 0.0)

    # 3. Contas a Vencer / Vencidas nos próx. 7 dias ou atrasadas
    limite_vencimento = hoje + timedelta(days=7)
    
    # KPI Isolado no Banco para evitar carregar dezenas de ORM Models na Memoria
    stmt_vencer_kpi = select(
        func.sum(Lancamento.valor).label("total_valor"),
        func.count(Lancamento.id).label("total_qnt")
    ).where(
        Lancamento.user_id == current_user.id,
        Lancamento.tipo == "despesa",
        Lancamento.is_pago == False,
        Lancamento.data_vencimento >= hoje,
        Lancamento.data_vencimento <= limite_vencimento
    )
    result_kpi = await db.execute(stmt_vencer_kpi)
    kpi_row = result_kpi.first()
    contas_a_vencer_valor = float(kpi_row.total_valor) if kpi_row and kpi_row.total_valor else 0.0
    contas_a_vencer_qnt = int(kpi_row.total_qnt) if kpi_row and kpi_row.total_qnt else 0

    # UI Lateral de Vencimentos (Busca apenas 10 com LIMIT para preservar tempo de processamento)
    stmt_vencer_ui = select(Lancamento).where(
        Lancamento.user_id == current_user.id,
        Lancamento.tipo == "despesa",
        Lancamento.is_pago == False,
        Lancamento.data_vencimento <= limite_vencimento
    ).order_by(Lancamento.data_vencimento.asc()).limit(10)
    
    result_vencer_ui = await db.execute(stmt_vencer_ui)
    contas_vencer = result_vencer_ui.scalars().all()

    proximos_vencimentos: list[ContaVencimento] = []
    
    # Exibir as Top 5 ou mais relevantes na UI (que puxamos ate 10 ali em cima)
    for c in contas_vencer[:5]:
        dias = (c.data_vencimento - hoje).days
        if dias < 0:
            status = "VENCIDO"
            dias_para_vencer = abs(dias)
        elif dias == 0:
            status = "HOJE"
            dias_para_vencer = 0
        else:
            status = "PENDENTE"
            dias_para_vencer = dias
            
        proximos_vencimentos.append(ContaVencimento(
            descricao=c.descricao,
            valor=float(c.valor),
            dias_para_vencer=dias_para_vencer,
            status=status
        ))

    # 4. Despesas por Categoria (Mes Atual)
    stmt_cat = select(
        Categoria.nome, func.sum(Lancamento.valor).label("total")
    ).join(Lancamento.categoria).where(
        Lancamento.user_id == current_user.id,
        Lancamento.tipo == "despesa",
        Lancamento.data_vencimento >= inicio_mes_atual,
        Lancamento.data_vencimento <= fim_mes_atual
    ).group_by(Categoria.nome).order_by(func.sum(Lancamento.valor).desc())
    
    result_cat = await db.execute(stmt_cat)
    cat_rows = result_cat.all()
    
    despesas_categoria = []
    for row in cat_rows:
        pct = (float(row.total) / despesa_mes * 100) if despesa_mes > 0 else 0.0
        despesas_categoria.append(CategoriaGasto(
            categoria=row.nome,
            valor=float(row.total),
            percentual=round(pct, 1)
        ))

    # 5. Fluxo de Caixa (Dias do Mes Atual)
    stmt_fluxo = select(
        extract('day', Lancamento.data_vencimento).label('dia'),
        Lancamento.tipo,
        func.sum(Lancamento.valor).label("total")
    ).where(
        Lancamento.user_id == current_user.id,
        Lancamento.data_vencimento >= inicio_mes_atual,
        Lancamento.data_vencimento <= fim_mes_atual
    ).group_by(
        extract('day', Lancamento.data_vencimento), Lancamento.tipo
    ).order_by('dia')
    
    result_fluxo = await db.execute(stmt_fluxo)
    
    fluxo_dict = {}
    
    for d in range(1, last_day_atual + 1):
        fluxo_dict[d] = {"receita": 0.0, "despesa": 0.0, "renegociacao": 0.0}
        
    for row in result_fluxo.all():
        d = int(row.dia)
        t = row.tipo
        val = float(row.total)
        if d in fluxo_dict:
            fluxo_dict[d][t] = val
            
    fluxo_caixa = []
    for d in sorted(fluxo_dict.keys()):
        fluxo_caixa.append(FluxoCaixaDia(
            dia=d,
            receita=fluxo_dict[d]["receita"],
            despesa=fluxo_dict[d]["despesa"],
            renegociacao=fluxo_dict[d]["renegociacao"]
        ))

    kpis = DashboardKPIs(
        receita_mes=receita_mes,
        crescimento_receita_perc=round(crescimento_receita_perc, 1),
        despesa_mes=despesa_mes,
        crescimento_despesa_perc=round(crescimento_despesa_perc, 1),
        renegociacao_mes=renegociacao_mes,
        crescimento_renegociacao_perc=round(crescimento_renegociacao_perc, 1),
        saldo_disponivel=saldo_disponivel,
        taxa_poupanca_perc=round(taxa_poupanca, 1),
        contas_a_vencer_valor=contas_a_vencer_valor,
        contas_a_vencer_qnt=contas_a_vencer_qnt
    )

    return DashboardResumoStats(
        kpis=kpis,
        despesas_categoria=despesas_categoria,
        fluxo_caixa=fluxo_caixa,
        proximos_vencimentos=proximos_vencimentos
    )
