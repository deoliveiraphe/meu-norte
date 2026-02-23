export interface Transaction {
  id: number;
  descricao: string;
  categoria: string;
  categoriaEmoji: string;
  tipo: 'receita' | 'despesa';
  vencimento: string;
  pagamento: string | null;
  valor: number;
  status: 'pago' | 'pendente' | 'vencido';
  recorrencia: string;
}

export interface Bill {
  descricao: string;
  valor: number;
  vencimento: string;
  status: 'hoje' | 'proximo' | 'futuro';
  diasRestantes: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; excerpt: string; relevance: number }[];
  chart?: boolean;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  date: string;
  messages: ChatMessage[];
}

export const mockTransactions: Transaction[] = [
  { id: 1, descricao: 'Salário', categoria: 'Receita', categoriaEmoji: '💼', tipo: 'receita', vencimento: '05/01', pagamento: '05/01', valor: 7000, status: 'pago', recorrencia: 'Mensal' },
  { id: 2, descricao: 'Freelance Design', categoria: 'Receita', categoriaEmoji: '💼', tipo: 'receita', vencimento: '10/01', pagamento: '10/01', valor: 1500, status: 'pago', recorrencia: 'Única' },
  { id: 3, descricao: 'Aluguel', categoria: 'Moradia', categoriaEmoji: '🏠', tipo: 'despesa', vencimento: '10/01', pagamento: '10/01', valor: 1800, status: 'pago', recorrencia: 'Mensal' },
  { id: 4, descricao: 'Cartão Nubank', categoria: 'Cartão', categoriaEmoji: '💳', tipo: 'despesa', vencimento: '23/01', pagamento: null, valor: 850, status: 'vencido', recorrencia: 'Mensal' },
  { id: 5, descricao: 'Internet Vivo', categoria: 'Contas', categoriaEmoji: '💡', tipo: 'despesa', vencimento: '26/01', pagamento: null, valor: 129.90, status: 'pendente', recorrencia: 'Mensal' },
  { id: 6, descricao: 'iFood', categoria: 'Alimentação', categoriaEmoji: '🛒', tipo: 'despesa', vencimento: '15/01', pagamento: '15/01', valor: 127.50, status: 'pago', recorrencia: 'Única' },
  { id: 7, descricao: 'Supermercado Extra', categoria: 'Alimentação', categoriaEmoji: '🛒', tipo: 'despesa', vencimento: '08/01', pagamento: '08/01', valor: 452.30, status: 'pago', recorrencia: 'Única' },
  { id: 8, descricao: 'Uber', categoria: 'Transporte', categoriaEmoji: '🚗', tipo: 'despesa', vencimento: '12/01', pagamento: '12/01', valor: 87.60, status: 'pago', recorrencia: 'Única' },
  { id: 9, descricao: 'Gasolina', categoria: 'Transporte', categoriaEmoji: '🚗', tipo: 'despesa', vencimento: '14/01', pagamento: '14/01', valor: 250.00, status: 'pago', recorrencia: 'Única' },
  { id: 10, descricao: 'Plano de Saúde', categoria: 'Saúde', categoriaEmoji: '💊', tipo: 'despesa', vencimento: '15/01', pagamento: '15/01', valor: 420.00, status: 'pago', recorrencia: 'Mensal' },
  { id: 11, descricao: 'Netflix', categoria: 'Lazer', categoriaEmoji: '🎬', tipo: 'despesa', vencimento: '20/01', pagamento: '20/01', valor: 55.90, status: 'pago', recorrencia: 'Mensal' },
  { id: 12, descricao: 'Spotify', categoria: 'Lazer', categoriaEmoji: '🎬', tipo: 'despesa', vencimento: '04/02', pagamento: null, valor: 21.90, status: 'pendente', recorrencia: 'Mensal' },
  { id: 13, descricao: 'Curso Udemy', categoria: 'Educação', categoriaEmoji: '📚', tipo: 'despesa', vencimento: '18/01', pagamento: '18/01', valor: 280.00, status: 'pago', recorrencia: 'Única' },
  { id: 14, descricao: 'Condomínio', categoria: 'Moradia', categoriaEmoji: '🏠', tipo: 'despesa', vencimento: '28/01', pagamento: null, valor: 680.00, status: 'pendente', recorrencia: 'Mensal' },
  { id: 15, descricao: 'Academia SmartFit', categoria: 'Saúde', categoriaEmoji: '💊', tipo: 'despesa', vencimento: '07/02', pagamento: null, valor: 89.90, status: 'pendente', recorrencia: 'Mensal' },
];

export const mockBills: Bill[] = [
  { descricao: 'Cartão Nubank', valor: 850, vencimento: 'Vence HOJE', status: 'hoje', diasRestantes: 0 },
  { descricao: 'Internet Vivo', valor: 129.90, vencimento: 'Vence em 3 dias', status: 'proximo', diasRestantes: 3 },
  { descricao: 'Condomínio', valor: 680, vencimento: 'Vence em 5 dias', status: 'proximo', diasRestantes: 5 },
  { descricao: 'Spotify', valor: 21.90, vencimento: 'Vence em 12 dias', status: 'futuro', diasRestantes: 12 },
  { descricao: 'Academia SmartFit', valor: 89.90, vencimento: 'Vence em 15 dias', status: 'futuro', diasRestantes: 15 },
];

export const mockCashFlowData = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  const receita = day === 5 ? 7000 : day === 10 ? 1500 : Math.random() * 200;
  const despesa = day <= 20 ? 150 + Math.random() * 300 : 50 + Math.random() * 100;
  return { day, receita: Math.round(receita), despesa: Math.round(despesa) };
});

export const mockExpenseCategories = [
  { name: 'Moradia', emoji: '🏠', value: 1800, percent: 31, color: '#1B3A6B' },
  { name: 'Alimentação', emoji: '🛒', value: 980, percent: 17, color: '#00C896' },
  { name: 'Outros', emoji: '💳', value: 1000, percent: 17, color: '#6B7280' },
  { name: 'Transporte', emoji: '🚗', value: 650, percent: 11, color: '#3B82F6' },
  { name: 'Saúde', emoji: '💊', value: 420, percent: 7, color: '#8B5CF6' },
  { name: 'Contas', emoji: '💡', value: 367.30, percent: 6, color: '#F59E0B' },
  { name: 'Lazer', emoji: '🎬', value: 350, percent: 6, color: '#EC4899' },
  { name: 'Educação', emoji: '📚', value: 280, percent: 5, color: '#14B8A6' },
];

export const mockMonthlyEvolution = [
  { month: 'Fev', receita: 7800, despesa: 5100, saldo: 2700 },
  { month: 'Mar', receita: 8200, despesa: 5400, saldo: 5500 },
  { month: 'Abr', receita: 8000, despesa: 5800, saldo: 7700 },
  { month: 'Mai', receita: 8500, despesa: 5200, saldo: 11000 },
  { month: 'Jun', receita: 7900, despesa: 5600, saldo: 13300 },
  { month: 'Jul', receita: 8300, despesa: 5300, saldo: 16300 },
  { month: 'Ago', receita: 8100, despesa: 5500, saldo: 18900 },
  { month: 'Set', receita: 8400, despesa: 5100, saldo: 22200 },
  { month: 'Out', receita: 8200, despesa: 5700, saldo: 24700 },
  { month: 'Nov', receita: 8600, despesa: 5400, saldo: 27900 },
  { month: 'Dez', receita: 9100, despesa: 6200, saldo: 30800 },
  { month: 'Jan', receita: 8500, despesa: 5847, saldo: 33453 },
];

export const mockConversations: Conversation[] = [
  {
    id: '1',
    title: 'Análise de gastos Jan/26',
    date: 'hoje',
    messages: [
      {
        id: 'm1', role: 'assistant', timestamp: new Date(),
        content: 'Olá, Maria! 👋 Sou seu assistente financeiro. Posso analisar seus gastos, identificar padrões, ajudar com planejamento e responder dúvidas sobre suas finanças. O que você gostaria de saber?'
      },
      {
        id: 'm2', role: 'user', timestamp: new Date(),
        content: 'Quais são meus maiores gastos esse mês?'
      },
      {
        id: 'm3', role: 'assistant', timestamp: new Date(),
        content: 'Com base nos seus lançamentos de janeiro de 2026, seus maiores gastos são:\n\n1. **🏠 Moradia** — R$ 1.800,00 (31% do total)\n   Inclui aluguel de R$ 1.800,00\n\n2. **💳 Cartão** — R$ 850,00 (15%)\n   Fatura do Nubank (⚠️ vencida)\n\n3. **🛒 Alimentação** — R$ 980,00 (17%)\n   iFood + supermercado\n\n4. **🚗 Transporte** — R$ 650,00 (11%)\n   Uber + gasolina\n\nSeu total de despesas é de **R$ 5.847,30**, representando 68,8% da sua receita mensal. Sua taxa de poupança está em 31,2%, acima da meta de 30%. 🎉\n\nQuer que eu detalhe alguma categoria específica?',
        sources: [
          { title: 'Lançamentos Jan/2026', excerpt: 'Cartão Nubank: R$ 850,00 — vencido', relevance: 98 },
          { title: 'Histórico Categorias', excerpt: 'Alimentação acumulado: R$ 980,00', relevance: 94 },
          { title: 'Média últimos 3 meses', excerpt: 'Média despesas: R$ 5.210,00', relevance: 87 },
        ]
      },
      {
        id: 'm4', role: 'user', timestamp: new Date(),
        content: 'Me dá um resumo visual dos gastos'
      },
      {
        id: 'm5', role: 'assistant', timestamp: new Date(),
        content: 'Aqui está um resumo visual das suas principais categorias de despesas em janeiro:',
        chart: true,
      },
    ]
  },
  { id: '2', title: 'Planejamento férias', date: 'ontem', messages: [] },
  { id: '3', title: 'Comparativo 2025 vs 2024', date: '3 dias atrás', messages: [] },
  { id: '4', title: 'Dicas para economizar', date: 'semana passada', messages: [] },
];

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
