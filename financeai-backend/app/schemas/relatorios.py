from pydantic import BaseModel
from typing import List

class EvolucaoMensal(BaseModel):
    month: str
    receita: float
    despesa: float
    renegociacao: float
    saldo: float

class CategoriaRanking(BaseModel):
    name: str # 'Moradia'
    current: float # valor gasta nesse periodo
    prev: float # valor gasto no periodo passado
    change: float # (crescimento vs reducao) %

class Indicadores(BaseModel):
    taxa_poupanca_perc: float
    comprometimento_renda_perc: float

class RelatorioEstatistico(BaseModel):
    evolucao: List[EvolucaoMensal]
    ranking_categorias: List[CategoriaRanking]
    indicadores: Indicadores
