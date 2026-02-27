from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from datetime import date
from dateutil.relativedelta import relativedelta
from typing import Optional

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.lancamento import Lancamento
from app.models.categoria import Categoria
from app.schemas.relatorios import RelatorioEstatistico, EvolucaoMensal, CategoriaRanking, Indicadores, ProjecaoMes
import calendar

router = APIRouter()

MESES_ABREV = {
    1: 'Jan', 2: 'Fev', 3: 'Mar', 4: 'Abr', 5: 'Mai', 6: 'Jun',
    7: 'Jul', 8: 'Ago', 9: 'Set', 10: 'Out', 11: 'Nov', 12: 'Dez'
}

@router.get("/resumo", response_model=RelatorioEstatistico)
async def obter_relatorio_geral(
    periodo: str = Query("mensal", description="mensal, trimestral, ou anual"),
    mes: Optional[int] = Query(None, description="Mês base"),
    ano: Optional[int] = Query(None, description="Ano base"),
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    hoje = date.today()
    target_mes = mes or hoje.month
    target_ano = ano or hoje.year
    
    # Determinar datas de Início (Current e Prev) baseadas no período escolhido
    if periodo == "anual":
        inicio_current = date(target_ano, 1, 1)
        fim_current = date(target_ano, 12, 31)
        inicio_prev = date(target_ano - 1, 1, 1)
        fim_prev = date(target_ano - 1, 12, 31)
    elif periodo == "trimestral":
        # Retroceder 3 meses a partir do 1o dia deste mes
        inicio_current = date(target_ano, target_mes, 1) - relativedelta(months=2) # 2 meses cheios + o mes atual
        _, last_day_atual = calendar.monthrange(target_ano, target_mes)
        fim_current = date(target_ano, target_mes, last_day_atual)
        
        fim_prev = inicio_current - relativedelta(days=1)
        inicio_prev = inicio_current - relativedelta(months=3)
    else: # "mensal"
        inicio_current = date(target_ano, target_mes, 1)
        _, last_day_atual = calendar.monthrange(target_ano, target_mes)
        fim_current = date(target_ano, target_mes, last_day_atual)
        
        fim_prev_mes = fim_current - relativedelta(months=1)
        inicio_prev = date(fim_prev_mes.year, fim_prev_mes.month, 1)
        _, last_day_prev = calendar.monthrange(fim_prev_mes.year, fim_prev_mes.month)
        fim_prev = date(fim_prev_mes.year, fim_prev_mes.month, last_day_prev)

    # 1. Evolução Patrimonial (Últimos 12 Meses Fixos)
    # A evolução de 1 ano serve ao gráfico de área e saldo histórico, independente do filtro pontual.
    inicio_evolucao = date(target_ano, target_mes, 1) - relativedelta(months=11)
    
    stmt_evolucao = select(
        extract('year', Lancamento.data_vencimento).label('ano'),
        extract('month', Lancamento.data_vencimento).label('mes'),
        Lancamento.tipo,
        func.sum(Lancamento.valor).label('total')
    ).where(
        Lancamento.user_id == current_user.id,
        Lancamento.data_vencimento >= inicio_evolucao,
        Lancamento.data_vencimento <= fim_current
    ).group_by(
        extract('year', Lancamento.data_vencimento), 
        extract('month', Lancamento.data_vencimento), 
        Lancamento.tipo
    )
    
    result_evo = await db.execute(stmt_evolucao)
    mapa_evo = {}
    
    for row in result_evo.all():
        meskey = f"{int(row.ano)}-{int(row.mes):02d}"
        if meskey not in mapa_evo:
            mapa_evo[meskey] = {"receita": 0.0, "despesa": 0.0, "renegociacao": 0.0}
        mapa_evo[meskey][row.tipo] = float(row.total)
    
    evolucao_list = []
    saldo_acumulado = 0.0
    
    # Gerar preenchimento ordenado dos ultimos 12 meses
    for i in range(11, -1, -1):
        d_cursor = date(target_ano, target_mes, 1) - relativedelta(months=i)
        meskey = f"{d_cursor.year}-{d_cursor.month:02d}"
        rec = mapa_evo.get(meskey, {}).get("receita", 0.0)
        desp = mapa_evo.get(meskey, {}).get("despesa", 0.0)
        reneg = mapa_evo.get(meskey, {}).get("renegociacao", 0.0)
        
        saldo_acumulado += (rec - desp)
        
        evolucao_list.append(EvolucaoMensal(
            month=f"{MESES_ABREV[d_cursor.month]}",
            receita=rec,
            despesa=desp,
            renegociacao=reneg,
            saldo=saldo_acumulado
        ))

    # 2. Ranking de Categorias (Atual vs Prev) no período escolhido
    async def get_despesas_categorias(dt_inicio: date, dt_fim: date):
        stmt = select(
            Categoria.nome, func.sum(Lancamento.valor).label("total")
        ).join(Lancamento.categoria).where(
            Lancamento.user_id == current_user.id,
            Lancamento.tipo == "despesa",
            Lancamento.data_vencimento >= dt_inicio,
            Lancamento.data_vencimento <= dt_fim
        ).group_by(Categoria.nome)
        res = await db.execute(stmt)
        return {row.nome: float(row.total) for row in res.all()}
    
    cat_current = await get_despesas_categorias(inicio_current, fim_current)
    cat_prev = await get_despesas_categorias(inicio_prev, fim_prev)
    
    # Todas as categorias do historico e unificar
    todas_categorias = set(list(cat_current.keys()) + list(cat_prev.keys()))
    ranking_categorias = []
    
    for c_nome in todas_categorias:
        val_curr = cat_current.get(c_nome, 0.0)
        val_prev = cat_prev.get(c_nome, 0.0)
        
        if val_prev > 0:
            change_perc = ((val_curr - val_prev) / val_prev) * 100
        else:
            change_perc = 100.0 if val_curr > 0 else 0.0
            
        ranking_categorias.append(CategoriaRanking(
            name=c_nome,
            current=val_curr,
            prev=val_prev,
            change=round(change_perc, 1)
        ))
    
    # Ordenar ranking pelo maior gasto atual
    ranking_categorias.sort(key=lambda x: x.current, reverse=True)

    # 3. Indicadores (Baseados no período full escolhido)
    stmt_indicadores = select(
        Lancamento.tipo, func.sum(Lancamento.valor).label("total")
    ).where(
        Lancamento.user_id == current_user.id,
        Lancamento.data_vencimento >= inicio_current,
        Lancamento.data_vencimento <= fim_current
    ).group_by(Lancamento.tipo)
    
    res_ind = await db.execute(stmt_indicadores)
    ind_map = {row.tipo: float(row.total) for row in res_ind.all()}
    
    rec_total = ind_map.get("receita", 0.0)
    desp_total = ind_map.get("despesa", 0.0)
    
    taxa_poupanca = ((rec_total - desp_total) / rec_total * 100) if rec_total > 0 else 0.0
    # Comprometimento usa apenas as despesas divididas pela receita. Se a despesa for maior ela passara de 100%.
    comp_renda = (desp_total / rec_total * 100) if rec_total > 0 else 0.0
    if comp_renda > 100.0: comp_renda = 100.0

    indicadores = Indicadores(
        taxa_poupanca_perc=round(taxa_poupanca, 1),
        comprometimento_renda_perc=round(comp_renda, 1),
        total_receitas=round(rec_total, 2),
        total_despesas=round(desp_total, 2),
    )

    # 4. Projeção de Saldo (3 meses reais + 3 projetados)
    # Busca os últimos 3 meses reais de saldo (receita - despesa)
    inicio_proj_real = date(target_ano, target_mes, 1) - relativedelta(months=2)
    stmt_proj = select(
        extract('year', Lancamento.data_vencimento).label('ano'),
        extract('month', Lancamento.data_vencimento).label('mes'),
        Lancamento.tipo,
        func.sum(Lancamento.valor).label('total')
    ).where(
        Lancamento.user_id == current_user.id,
        Lancamento.data_vencimento >= inicio_proj_real,
        Lancamento.data_vencimento <= fim_current
    ).group_by(
        extract('year', Lancamento.data_vencimento),
        extract('month', Lancamento.data_vencimento),
        Lancamento.tipo
    )
    result_proj = await db.execute(stmt_proj)
    mapa_proj = {}
    for row in result_proj.all():
        key = f"{int(row.ano)}-{int(row.mes):02d}"
        if key not in mapa_proj:
            mapa_proj[key] = {"receita": 0.0, "despesa": 0.0}
        if row.tipo in ("receita", "despesa"):
            mapa_proj[key][row.tipo] = float(row.total)

    saldos_reais = []
    projecao_saldo = []
    for i in range(2, -1, -1):
        d = date(target_ano, target_mes, 1) - relativedelta(months=i)
        key = f"{d.year}-{d.month:02d}"
        rec = mapa_proj.get(key, {}).get("receita", 0.0)
        desp = mapa_proj.get(key, {}).get("despesa", 0.0)
        saldo = round(rec - desp, 2)
        saldos_reais.append(saldo)
        projecao_saldo.append(ProjecaoMes(
            month=f"{MESES_ABREV[d.month]}/{str(d.year)[2:]}",
            saldo=saldo,
            tipo="real"
        ))

    media_saldo = sum(saldos_reais) / len(saldos_reais) if saldos_reais else 0.0
    for i in range(1, 4):
        d = date(target_ano, target_mes, 1) + relativedelta(months=i)
        projecao_saldo.append(ProjecaoMes(
            month=f"{MESES_ABREV[d.month]}/{str(d.year)[2:]}",
            saldo=round(media_saldo, 2),
            tipo="proj"
        ))

    return RelatorioEstatistico(
        evolucao=evolucao_list,
        ranking_categorias=ranking_categorias,
        indicadores=indicadores,
        projecao_saldo=projecao_saldo,
    )
