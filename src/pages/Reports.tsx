import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileSpreadsheet, Share2, TrendingUp, TrendingDown } from 'lucide-react';
import { mockMonthlyEvolution, mockExpenseCategories, formatCurrency } from '@/data/mockData';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, LineChart, Line,
} from 'recharts';
import { useState } from 'react';

const COLORS = ['#1B3A6B', '#00C896', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6', '#6B7280'];

const categoryRanking = [
  { name: 'Moradia', current: 1800, prev: 1800, change: 0 },
  { name: 'Alimentação', current: 980, prev: 797, change: 23 },
  { name: 'Transporte', current: 650, prev: 580, change: 12 },
  { name: 'Saúde', current: 420, prev: 420, change: 0 },
  { name: 'Contas', current: 367, prev: 350, change: 5 },
  { name: 'Lazer', current: 350, prev: 410, change: -15 },
  { name: 'Educação', current: 280, prev: 200, change: 40 },
  { name: 'Outros', current: 1000, prev: 653, change: 53 },
];

const projectionData = [
  { month: 'Jan', saldo: 33453, type: 'real' },
  { month: 'Fev', saldo: 36100, type: 'proj' },
  { month: 'Mar', saldo: 38800, type: 'proj' },
  { month: 'Abr', saldo: 41400, type: 'proj' },
];

const savingsGauge = [{ name: 'Taxa', value: 31.2, fill: '#00C896' }];

export default function Reports() {
  const [period, setPeriod] = useState('mensal');

  const donutData = mockExpenseCategories.map(c => ({ name: c.name, value: c.value }));
  const totalExpenses = donutData.reduce((s, d) => s + d.value, 0);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            <TabsTrigger value="mensal" className="text-xs">Mensal</TabsTrigger>
            <TabsTrigger value="trimestral" className="text-xs">Trimestral</TabsTrigger>
            <TabsTrigger value="anual" className="text-xs">Anual</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Section 1: Evolution */}
      <Card className="p-5 card-shadow mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Evolução Patrimonial — Últimos 12 Meses</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={mockMonthlyEvolution}>
            <defs>
              <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00C896" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#00C896" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gDesp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF4D4F" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#FF4D4F" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 92%)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Area type="monotone" dataKey="receita" stroke="#00C896" fill="url(#gRec)" strokeWidth={2} name="Receitas" />
            <Area type="monotone" dataKey="despesa" stroke="#FF4D4F" fill="url(#gDesp)" strokeWidth={2} name="Despesas" />
            <Line type="monotone" dataKey="saldo" stroke="#1B3A6B" strokeWidth={2.5} dot={false} name="Saldo Acumulado" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Section 2: Category Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-5 card-shadow">
          <h3 className="text-sm font-semibold text-foreground mb-4">Distribuição de Despesas</h3>
          <div className="flex items-center justify-center">
            <div className="relative">
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={2} dataKey="value">
                    {donutData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{formatCurrency(totalExpenses)}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {donutData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-xs text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 card-shadow">
          <h3 className="text-sm font-semibold text-foreground mb-4">Ranking de Categorias</h3>
          <div className="space-y-2">
            {categoryRanking.map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-3 py-1.5">
                <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                <span className="text-sm font-medium text-foreground flex-1">{cat.name}</span>
                <span className="text-sm font-semibold text-foreground w-24 text-right">{formatCurrency(cat.current)}</span>
                <div className={`flex items-center gap-0.5 w-16 justify-end text-xs font-medium ${
                  cat.change > 0 ? 'text-danger' : cat.change < 0 ? 'text-success' : 'text-muted-foreground'
                }`}>
                  {cat.change > 0 && <TrendingUp className="w-3 h-3" />}
                  {cat.change < 0 && <TrendingDown className="w-3 h-3" />}
                  {cat.change !== 0 ? `${Math.abs(cat.change)}%` : '—'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Section 3: Financial Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 card-shadow text-center">
          <h3 className="text-sm font-semibold text-foreground mb-2">Taxa de Poupança</h3>
          <div className="flex justify-center">
            <ResponsiveContainer width={140} height={140}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={savingsGauge} startAngle={180} endAngle={0}>
                <RadialBar background dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-3xl font-bold text-foreground -mt-8">31,2%</p>
          <p className="text-xs text-success font-medium mt-1">Meta: 30% ✅</p>
        </Card>

        <Card className="p-5 card-shadow">
          <h3 className="text-sm font-semibold text-foreground mb-4">Comprometimento de Renda</h3>
          <p className="text-3xl font-bold text-foreground text-center mb-4">68,8%</p>
          <div className="h-4 rounded-full overflow-hidden flex bg-secondary">
            <div className="bg-primary h-full" style={{ width: '42%' }} />
            <div className="h-full" style={{ width: '27%', backgroundColor: '#3B82F6' }} />
            <div className="bg-success h-full" style={{ width: '31%' }} />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Fixos 42%</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3B82F6' }} /> Variável 27%</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Poupança 31%</div>
          </div>
        </Card>

        <Card className="p-5 card-shadow">
          <h3 className="text-sm font-semibold text-foreground mb-2">Projeção de Saldo</h3>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={projectionData}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="saldo" stroke="#1B3A6B" strokeWidth={2} strokeDasharray="0" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted-foreground text-center mt-1">Projeção baseada nos últimos 3 meses</p>
        </Card>
      </div>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="gap-1.5 text-xs"><Download className="w-4 h-4" /> Exportar PDF</Button>
        <Button variant="outline" className="gap-1.5 text-xs"><FileSpreadsheet className="w-4 h-4" /> Exportar Excel</Button>
        <Button variant="outline" className="gap-1.5 text-xs"><Share2 className="w-4 h-4" /> Compartilhar</Button>
      </div>
    </AppLayout>
  );
}
