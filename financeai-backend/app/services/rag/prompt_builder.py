from typing import List, Dict
from app.models.embedding import FinanceEmbedding

class PromptBuilder:
    def formatar_fontes_para_contexto(self, fontes: List[FinanceEmbedding]) -> str:
        if not fontes:
            return "Nenhum histórico ou dado financeiro encontrado."
            
        texto_fontes = ""
        for index, fonte in enumerate(fontes):
            data_criacao = fonte.created_at.strftime("%d/%m/%Y")
            texto_fontes += f"[{index + 1}] Data de Registro: {data_criacao} - Detalhe: {fonte.conteudo}\n"
        return texto_fontes

    def formatar_categorias_para_contexto(self, detalhes_categoria: Dict[str, dict]) -> str:
        texto = ""
        if detalhes_categoria.get("receita"):
            texto += "  - Receitas por Categoria:\n"
            for cat, valor in detalhes_categoria["receita"].items():
                texto += f"    * {cat}: R$ {valor:,.2f}\n"
        
        if detalhes_categoria.get("despesa"):
            texto += "  - Despesas por Categoria:\n"
            for cat, valor in detalhes_categoria["despesa"].items():
                texto += f"    * {cat}: R$ {valor:,.2f}\n"

        if not texto:
            texto = "  - Nenhuma categoria movimentada neste mês.\n"
            
        return dict(texto=texto)

    def construir_contexto_sistema(
        self,
        mes_atual: str,
        receita_total: float,
        despesa_total: float,
        saldo: float,
        detalhes_categoria: Dict[str, dict],
        fontes: List[FinanceEmbedding]
    ) -> str:
        fontes_formatadas = self.formatar_fontes_para_contexto(fontes)
        categorias_formatadas = self.formatar_categorias_para_contexto(detalhes_categoria)["texto"]
        
        system_prompt = f"""
Você é um assistente financeiro pessoal de elite e empático chamado "Meu Norte AI" ou "Assistente Meu Norte".
Você tem acesso aos dados financeiros dinâmicos e isolados deste usuário através do banco de dados (RAG e Totais).

CONTEXTO CÁLCULOS DO MÊS ATUAL:
- Mês referẽncia: {mes_atual}
- Receita total faturada ou a receber: R$ {receita_total:,.2f}
- Despesa total lançada: R$ {despesa_total:,.2f}
- Saldo atual/projetado: R$ {saldo:,.2f}

VISÃO GRANULAR DE CATEGORIAS DE GASTOS DO MÊS:
{categorias_formatadas}

LANÇAMENTOS E INFORMAÇÕES RELEVANTES RECUPERADAS DAS BUSCAS ANTERIORES:
{fontes_formatadas}

REGRAS ESTABELECIDAS DE COMPORTAMENTO E ASSESSORIA:
- Analise os bloqueios e exageros: Se o usuário estiver perguntando se pode gastar, analise as "Despesas por Categoria" e aponte se ele já está extrapolando em algum quesito baseado no 'Saldo atual/projetado', aja como um verdadeiro mentor.
- Se o usuário pedir conselhos baseados em faturas futuras, preveja impactos negativos se o saldo atual for baixo.
- Nunca invente transações que não estejam informadas no contexto acima ou RAG extraído.
- Formate todos os valores monetários no padrão brasileiro (Ex: R$ 1.500,00). Use Markdown (negritos, listas) para facilitar a leitura na tela.
- Se a pergunta do usuário não for sobre finanças, contabilidade ou organização de dinheiro, educadamente traga o papo de volta para o planejamento do Meu Norte.
"""
        return system_prompt.strip()

    def construir_prompt_extracao(self, pergunta: str, mes_atual_num: int, ano_atual_num: int) -> str:
        prompt = f"""
Você é um extrator de intenções financeiras ultra-preciso.
Sua única função é analisar o texto do usuário e retornar EXCLUSIVAMENTE um objeto JSON estruturado caso o usuário queira CRIAR ou ADICIONAR uma receita ou despesa.

Contexto de Datas: Assuma que estamos no mês {mes_atual_num} do ano {ano_atual_num}.
Exemplo: Se o usuário disser "dia 15", será o dia 15/{mes_atual_num:02d}/{ano_atual_num}. 
Se disser "mês que vem", ajuste o mês para {mes_atual_num + 1} (virando o ano se passar de 12). 
Se a data for ambígua e o vencimento não for informado, use a data atual aproximada.
Se o número de parcelas ou 'vezes' não for dito, parcelas = 1.

O FORMATO JSON OBRIGATÓRIO (sem texto adicional fora dele):
{{
  "intencao_de_criar": true / false,
  "nome": "Carro",
  "valor": 2500.00,
  "data_inicial": "YYYY-MM-DD",
  "parcelas": 36,
  "tipo": "despesa" / "receita"
}}

- "valor" deve ser um número float puro. Converta milhares e dezenas ditas em texto para formato Float do python. Ex: '2 mil' -> 2000.0. E remova sinais de $ ou R$.
- Se "intencao_de_criar" for falso ou o usuário estiver apenas perguntando um conselho, devolva: {{"intencao_de_criar": false}}. Não preencha o resto.

TEXTO DO USUÁRIO: "{pergunta}"
"""
        return prompt.strip()

prompt_builder = PromptBuilder()
