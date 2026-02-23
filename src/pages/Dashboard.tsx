import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock, ArrowRight, Bot, Calendar } from 'lucide-react';
import { mockBills, mockCashFlowData, mockExpenseCategories, formatCurrency } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { useEffect, useState } from 'react';

function KPICard({ title, value, subtitle, subtitleColor, children, delay }: {
  title: string; value: string; subtitle: string; subtitleColor: string; children?: React.ReactNode; delay: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <Card className={`p-5 card-shadow hover:card-shadow-hover transition-all duration-300 ${visible ? 'slide-up' : 'opacity-0'}`}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
      <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${subtitleColor}`}>
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

  return (
    <AppLayout>
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Receita do Mês" value="R$ 8.500,00" subtitle="↑ 5% vs mês anterior" subtitleColor="text-success" delay={0}>
          <ProgressBar percent={85} color="bg-success" />
        </KPICard>
        <KPICard title="Despesas do Mês" value="R$ 5.847,30" subtitle="↑ 12% vs mês anterior" subtitleColor="text-danger" delay={50}>
          <ProgressBar percent={69} color="bg-danger" />
        </KPICard>
        <KPICard title="Saldo Disponível" value="R$ 2.652,70" subtitle="Após todas as despesas" subtitleColor="text-success" delay={100}>
          <div className="flex justify-end"><SavingsRing percent={31} /></div>
        </KPICard>
        <KPICard title="A Vencer (7 dias)" value="R$ 1.230,00" subtitle="3 contas pendentes" subtitleColor="text-warning" delay={150}>
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3 text-warning" />
            <span className="text-xs text-warning font-medium">Atenção</span>
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
              <AreaChart data={mockCashFlowData}>
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00C896" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00C896" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF4D4F" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#FF4D4F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 92%)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="receita" stroke="#00C896" fill="url(#greenGrad)" strokeWidth={2} name="Receitas" />
                <Area type="monotone" dataKey="despesa" stroke="#FF4D4F" fill="url(#redGrad)" strokeWidth={2} name="Despesas" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5 card-shadow">
            <h3 className="text-sm font-semibold text-foreground mb-4">Despesas por Categoria</h3>
            <div className="space-y-3">
              {mockExpenseCategories.map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">{cat.emoji}</span>
                  <span className="text-sm font-medium text-foreground w-24 truncate">{cat.name}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-secondary">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${cat.percent}%`, backgroundColor: cat.color }} />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-24 text-right">{formatCurrency(cat.value)}</span>
                  <span className="text-xs text-muted-foreground w-10 text-right">{cat.percent}%</span>
                </div>
              ))}
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
            <div className="space-y-3">
              {mockBills.map((bill, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    bill.status === 'hoje' ? 'bg-danger' : bill.status === 'proximo' ? 'bg-warning' : 'bg-success'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{bill.descricao}</p>
                    <p className="text-xs text-muted-foreground">{bill.vencimento}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(bill.valor)}</span>
                </div>
              ))}
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
