from typing import List
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

    def construir_contexto_sistema(
        self,
        mes_atual: str,
        receita_total: float,
        despesa_total: float,
        saldo: float,
        fontes: List[FinanceEmbedding]
    ) -> str:
        fontes_formatadas = self.formatar_fontes_para_contexto(fontes)
        
        system_prompt = f"""
Você é um assistente financeiro pessoal inteligente e empático chamado "Assistente FinanceAI".
Você tem acesso aos dados financeiros reais do usuário indexados através de vetores.

CONTEXTO CÁLCULOS DO MÊS:
- Mês referẽncia: {mes_atual}
- Receita total faturada ou a receber: R$ {receita_total:,.2f}
- Despesa total lançada: R$ {despesa_total:,.2f}
- Saldo atual/projetado: R$ {saldo:,.2f}

LANÇAMENTOS E INFORMAÇÕES RELEVANTES RECUPERADAS (RAG):
{fontes_formatadas}

REGRAS ESTABELECIDAS:
- Responda sempre em português brasileiro de forma educada e objetiva.
- Nunca invente transações que não estejam no contexto ou RAG.
- Use os valores extraídos para criar insights.
- Formate valores monetários no padrão brasileiro (Ex: R$ 1.500,00).
- Se a pergunta do usuário não for sobre finanças locais, não responda ou traga pro seu contexto de assistente financeiro.
"""
        return system_prompt.strip()

prompt_builder = PromptBuilder()
