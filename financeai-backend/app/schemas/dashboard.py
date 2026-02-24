from pydantic import BaseModel
from typing import List

class CategoriaGasto(BaseModel):
    categoria: str
    valor: float
    percentual: float

class DashboardKPIs(BaseModel):
    receita_mes: float
    crescimento_receita_perc: float
    despesa_mes: float
    crescimento_despesa_perc: float
    renegociacao_mes: float
    crescimento_renegociacao_perc: float
    saldo_disponivel: float
    taxa_poupanca_perc: float
    contas_a_vencer_valor: float
    contas_a_vencer_qnt: int

class FluxoCaixaDia(BaseModel):
    dia: int
    receita: float
    despesa: float
    renegociacao: float

class ContaVencimento(BaseModel):
    descricao: str
    valor: float
    dias_para_vencer: int
    status: str # VENCIDO, PENDENTE, OK

class DashboardResumoStats(BaseModel):
    kpis: DashboardKPIs
    despesas_categoria: List[CategoriaGasto]
    fluxo_caixa: List[FluxoCaixaDia]
    proximos_vencimentos: List[ContaVencimento]
