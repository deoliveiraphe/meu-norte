import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock, ArrowRight, Bot, Calendar } from 'lucide-react';
import { formatCurrency } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useFinanceStore } from '@/stores/useFinanceStore';

const CATEGORY_EMOJIS: Record<string, string> = {
  'Moradia': '🏠',
  'Transporte': '🚗',
  'Alimentação': '🍔',
  'Saúde': '💊',
  'Lazer': '🎉',
  'Educação': '📚',
  'Contas': '⚡',
  'Empréstimo': '🏦',
  'Cartão': '💳',
  'Receita': '💰',
  'Outros': '📦',
};
const CATEGORY_COLORS: Record<string, string> = {
  'Moradia': '#00C896',
  'Transporte': '#3B82F6',
  'Alimentação': '#F59E0B',
  'Saúde': '#EF4444',
  'Lazer': '#8B5CF6',
  'Educação': '#EC4899',
  'Contas': '#F97316',
  'Empréstimo': '#64748B',
  'Cartão': '#14B8A6',
  'Receita': '#00C896',
  'Outros': '#9CA3AF',
};

function KPICard({ title, value, subtitle, subtitleColor, children, delay }: {
  title: string; value: string; subtitle: string; subtitleColor: string; children?: React.ReactNode; delay: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <Card className={`p-4 xl:p-5 card-shadow hover:card-shadow-hover transition-all duration-300 ${visible ? 'slide-up' : 'opacity-0'} overflow-hidden`}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">{title}</p>
      <p className="text-lg xl:text-2xl font-bold text-foreground mt-1 truncate">{value}</p>
      <p className={`text-[10px] xl:text-xs font-medium mt-1 flex items-center gap-1 truncate ${subtitleColor}`}>
        {subtitleColor === 'text-success' && <TrendingUp className="w-3 h-3" />}
        {subtitleColor === 'text-danger' && <TrendingDown className="w-3 h-3" />}
        {subtitle}
      </p>
      {children && <div className="mt-3">{children}</div>}
    </Card>
  );
}

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="w-full h-2 rounded-full bg-secondary">
      <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

function SavingsRing({ percent }: { percent: number }) {
  const r = 28; const c = 2 * Math.PI * r; const offset = c - (percent / 100) * c;
  return (
    <div className="relative w-16 h-16">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="hsl(220 14% 92%)" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="hsl(162 100% 39%)" strokeWidth="6"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">{percent}%</span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentMonth, currentYear } = useFinanceStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        // month no zustand é 0-indexed, na API a gente fez 1-12
        const res = await api.get(`/dashboard/resumo?mes=${currentMonth + 1}&ano=${currentYear}`);
        setData(res);
      } catch (err) {
        console.error("Erro ao carregar dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [currentMonth, currentYear]);

  if (loading || !data) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  const { kpis, despesas_categoria, fluxo_caixa, proximos_vencimentos } = data;

  return (
    <AppLayout>
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <KPICard
          title="Receita do Mês"
          value={formatCurrency(kpis.receita_mes)}
          subtitle={`${kpis.crescimento_receita_perc >= 0 ? '↑' : '↓'} ${Math.abs(kpis.crescimento_receita_perc).toFixed(1)}% vs mês ant.`}
          subtitleColor={kpis.crescimento_receita_perc >= 0 ? "text-success" : "text-danger"}
          delay={0}
        >
          <ProgressBar percent={100} color="bg-success" />
        </KPICard>
        <KPICard
          title="Despesas do Mês"
          value={formatCurrency(kpis.despesa_mes)}
          subtitle={`${kpis.crescimento_despesa_perc >= 0 ? '↑' : '↓'} ${Math.abs(kpis.crescimento_despesa_perc).toFixed(1)}% vs mês ant.`}
          subtitleColor={kpis.crescimento_despesa_perc <= 0 ? "text-success" : "text-danger"}
          delay={50}
        >
          <ProgressBar
            percent={kpis.receita_mes > 0 ? Math.min((kpis.despesa_mes / kpis.receita_mes) * 100, 100) : 100}
            color={kpis.despesa_mes > kpis.receita_mes ? "bg-danger" : "bg-warning"}
          />
        </KPICard>
        <KPICard
          title="Renegociado do Mês"
          value={formatCurrency(kpis.renegociacao_mes || 0)}
          subtitle={`${(kpis.crescimento_renegociacao_perc || 0) >= 0 ? '↑' : '↓'} ${Math.abs(kpis.crescimento_renegociacao_perc || 0).toFixed(1)}% vs ant.`}
          subtitleColor={(kpis.crescimento_renegociacao_perc || 0) <= 0 ? "text-success" : "text-warning"}
          delay={75}
        >
          <ProgressBar
            percent={kpis.despesa_mes > 0 ? Math.min((kpis.renegociacao_mes / kpis.despesa_mes) * 100, 100) : 0}
            color="bg-warning"
          />
        </KPICard>
        <KPICard
          title="Saldo Disponível"
          value={formatCurrency(kpis.saldo_disponivel)}
          subtitle="Taxa de Salvamento Geral"
          subtitleColor={kpis.saldo_disponivel >= 0 ? "text-success" : "text-danger"}
          delay={100}
        >
          <div className="flex justify-end"><SavingsRing percent={kpis.taxa_poupanca_perc >= 0 ? Number(kpis.taxa_poupanca_perc.toFixed(0)) : 0} /></div>
        </KPICard>
        <KPICard
          title="A Vencer (7 dias)"
          value={formatCurrency(kpis.contas_a_vencer_valor)}
          subtitle={`${kpis.contas_a_vencer_qnt} contas pendentes`}
          subtitleColor={kpis.contas_a_vencer_qnt > 0 ? "text-warning" : "text-success"}
          delay={150}
        >
          <div className="flex items-center gap-1 mt-1">
            <Clock className={`w-3 h-3 ${kpis.contas_a_vencer_qnt > 0 ? "text-warning" : "text-success"}`} />
            <span className={`text-xs font-medium ${kpis.contas_a_vencer_qnt > 0 ? "text-warning" : "text-success"}`}>
              {kpis.contas_a_vencer_qnt > 0 ? 'Atenção' : 'Tudo Certo'}
            </span>
          </div>
        </KPICard>
      </div>

      {/* Middle section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-5 card-shadow">
            <h3 className="text-sm font-semibold text-foreground mb-4">Fluxo de Caixa</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={fluxo_caixa}>
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00C896" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00C896" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF4D4F" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#FF4D4F" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 92%)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="receita" stroke="#00C896" fill="url(#greenGrad)" strokeWidth={2} name="Receitas" />
                <Area type="monotone" dataKey="despesa" stroke="#FF4D4F" fill="url(#redGrad)" strokeWidth={2} name="Despesas" />
                <Area type="monotone" dataKey="renegociacao" stroke="#F59E0B" fill="url(#orangeGrad)" strokeWidth={2} name="Renegociação" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5 card-shadow">
            <h3 className="text-sm font-semibold text-foreground mb-4">Despesas por Categoria</h3>
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {despesas_categoria.map((cat: any) => (
                <div key={cat.categoria} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">{CATEGORY_EMOJIS[cat.categoria] || '📌'}</span>
                  <span className="text-sm font-medium text-foreground w-24 truncate">{cat.categoria}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-secondary">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${cat.percentual}%`, backgroundColor: CATEGORY_COLORS[cat.categoria] || '#9CA3AF' }} />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-24 text-right">{formatCurrency(cat.valor)}</span>
                  <span className="text-xs text-muted-foreground w-10 text-right">{cat.percentual}%</span>
                </div>
              ))}
              {despesas_categoria.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">Nenhuma despesa registrada.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 card-shadow">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Vencimentos</h3>
            </div>
            <div className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {proximos_vencimentos.map((bill: any, i: number) => {
                const isVencido = bill.status === 'VENCIDO';
                const isHoje = bill.status === 'HOJE';
                const isUrgente = !isVencido && !isHoje && bill.dias_para_vencer <= 2;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-2 rounded-lg border transition-colors
                      ${isVencido ? 'bg-destructive/5 border-destructive/20' :
                        isHoje ? 'bg-warning/5 border-warning/20' :
                          isUrgente ? 'bg-orange-500/5 border-orange-500/20' :
                            'border-transparent'}`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0
                      ${isVencido ? 'bg-destructive' : isHoje ? 'bg-warning' : isUrgente ? 'bg-orange-500' : 'bg-success'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{bill.descricao}</p>
                      <p className={`text-[10px] font-medium
                        ${isVencido ? 'text-destructive' : isHoje ? 'text-warning' : isUrgente ? 'text-orange-500' : 'text-muted-foreground'}`}>
                        {isHoje ? '⚠️ Vence hoje!' :
                          isVencido ? `🔴 Vencido há ${Math.abs(bill.dias_para_vencer)} dia(s)` :
                            isUrgente ? `⚡ Vence em ${bill.dias_para_vencer} dia(s)` :
                              `Vence em ${bill.dias_para_vencer} dia(s)`}
                      </p>
                    </div>
                    <span className={`text-xs font-bold flex-shrink-0
                      ${isVencido ? 'text-destructive' : isHoje ? 'text-warning' : 'text-foreground'}`}>
                      {formatCurrency(bill.valor)}
                    </span>
                  </div>
                );
              })}
              {proximos_vencimentos.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">Nenhuma dívida próxima.</p>
              )}
            </div>
            <button
              onClick={() => navigate('/lancamentos')}
              className="flex items-center gap-1 text-xs font-medium text-accent mt-3 hover:underline"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </button>
          </Card>

          <Card className="p-5 card-shadow bg-gradient-to-br from-card to-secondary/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-accent" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Insight do Assistente</h3>
            </div>
            <p className="text-sm text-card-foreground leading-relaxed">
              Suas despesas com alimentação aumentaram <strong>23%</strong> este mês. Considerando sua meta de economia, sugiro revisar os gastos nessa categoria. Quer que eu analise em detalhes?
            </p>
            <button
              onClick={() => navigate('/assistente')}
              className="mt-3 flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
            >
              Conversar com IA <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
