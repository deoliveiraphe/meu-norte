from app.models.lancamento import Lancamento
import json

def formatar_para_embedding(lancamento: Lancamento) -> str:
    """
    Formata os dados do Lançamento Financeiro numa String semântica para indexação vetorial.
    Essa string será convertida em Embeddings pelo Ollama e salva no BD pgvector.
    
    Exemplo Gerado: 
    Lançamento de DESPESA: 'Compra de Notebook' no valor de R$ 4500.00
    Data Vencimento: 2026-02-15. Status Pago: Sim.
    """
    pago_str = "Sim" if lancamento.is_pago else "Não"
    
    obs = ""
    if lancamento.observacoes:
        obs = f" - Observações adicionais: {lancamento.observacoes}"
        
    texto = (
        f"Lançamento Financeiro de {lancamento.tipo.upper()}: '{lancamento.descricao}' "
        f"no valor de R$ {lancamento.valor:.2f}. "
        f"Data de Vencimento: {lancamento.data_vencimento}. "
        f"Status de Pagamento: Pago ({pago_str}).{obs}"
    )
    return texto
