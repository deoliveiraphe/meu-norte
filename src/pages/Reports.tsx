import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, FileSpreadsheet, Share2, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/data/mockData';
import { api } from '@/lib/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, LineChart, Line,
} from 'recharts';
import { useState, useEffect } from 'react';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { toast } from '@/components/ui/sonner';

const COLORS = ['#1B3A6B', '#00C896', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6', '#6B7280'];


export default function Reports() {
  const { currentMonth, currentYear } = useFinanceStore();
  const [period, setPeriod] = useState('mensal');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/relatorios/resumo?periodo=${period}&mes=${currentMonth + 1}&ano=${currentYear}`);
        setData(res);
      } catch (err) {
        console.error("Erro ao carregar relatório:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [period, currentMonth, currentYear]);

  if (loading || !data) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  const { evolucao, ranking_categorias, indicadores, projecao_saldo } = data;

  // Adaptador pro Donut
  const donutData = ranking_categorias
    .map((c: { name: string; current: number }) => ({ name: c.name, value: c.current }))
    .filter((d: { value: number }) => d.value > 0);
  const totalExpenses = donutData.reduce((s: number, d: { value: number }) => s + d.value, 0);

  // Adaptador Radial Poupança
  const savingsGauge = [{ name: 'Taxa', value: indicadores.taxa_poupanca_perc, fill: '#00C896' }];

  const nomeMes = new Date(currentYear, currentMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Meu Norte — Relatório ${nomeMes}`, 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 23);
    autoTable(doc, {
      startY: 37,
      head: [['Indicador', 'Valor']],
      body: [
        ['Taxa de Poupança', `${indicadores.taxa_poupanca_perc}%`],
        ['Comprometimento de Renda', `${indicadores.comprometimento_renda_perc}%`],
        ['Total Receitas', formatCurrency(indicadores.total_receitas ?? 0)],
        ['Total Despesas', formatCurrency(indicadores.total_despesas ?? 0)],
        ['Saldo do Período', formatCurrency((indicadores.total_receitas ?? 0) - (indicadores.total_despesas ?? 0))],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [27, 58, 107] },
    });
    const afterIndicadores = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text('Ranking de Categorias', 14, afterIndicadores);
    autoTable(doc, {
      startY: afterIndicadores + 4,
      head: [['#', 'Categoria', 'Valor', 'Variação']],
      body: ranking_categorias.map((c: any, i: number) => [
        i + 1, c.name, formatCurrency(c.current),
        c.change !== 0 ? `${c.change > 0 ? '+' : ''}${c.change}%` : '—',
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [27, 58, 107] },
    });
    doc.save(`meu-norte-relatorio-${nomeMes}.pdf`);
    toast.success('PDF do relatório exportado!');
  };

  const handleExportExcel = () => {
    const wsIndicadores = XLSX.utils.json_to_sheet([
      { Indicador: 'Taxa de Poupança', Valor: `${indicadores.taxa_poupanca_perc}%` },
      { Indicador: 'Comprometimento de Renda', Valor: `${indicadores.comprometimento_renda_perc}%` },
      { Indicador: 'Total Receitas', Valor: indicadores.total_receitas ?? 0 },
      { Indicador: 'Total Despesas', Valor: indicadores.total_despesas ?? 0 },
    ]);
    const wsRanking = XLSX.utils.json_to_sheet(
      ranking_categorias.map((c: any, i: number) => ({
        '#': i + 1, Categoria: c.name,
        Valor: c.current,
        Variação: c.change !== 0 ? `${c.change > 0 ? '+' : ''}${c.change}%` : '—',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsIndicadores, 'Indicadores');
    XLSX.utils.book_append_sheet(wb, wsRanking, 'Ranking Categorias');
    XLSX.writeFile(wb, `meu-norte-relatorio-${nomeMes}.xlsx`);
    toast.success('Excel do relatório exportado!');
  };

  const handleCompartilhar = async () => {
    const texto = [
      `📊 Meu Norte — Relatório ${nomeMes}`,
      ``,
      `📦 Taxa de Poupança: ${indicadores.taxa_poupanca_perc}%`,
      `💳 Comprometimento: ${indicadores.comprometimento_renda_perc}%`,
      `📈 Receitas: ${formatCurrency(indicadores.total_receitas ?? 0)}`,
      `📉 Despesas: ${formatCurrency(indicadores.total_despesas ?? 0)}`,
    ].join('\n');
    if (navigator.share) {
      await navigator.share({ title: `Meu Norte — ${nomeMes}`, text: texto });
    } else {
      await navigator.clipboard.writeText(texto);
      toast.success('Resumo copiado para a área de transferência! 📋');
    }
  };

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
          <AreaChart data={evolucao}>
            <defs>
              <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00C896" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#00C896" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gDesp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF4D4F" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#FF4D4F" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gReneg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 92%)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Area type="monotone" dataKey="receita" stroke="#00C896" fill="url(#gRec)" strokeWidth={2} name="Receitas" />
            <Area type="monotone" dataKey="despesa" stroke="#FF4D4F" fill="url(#gDesp)" strokeWidth={2} name="Despesas" />
            <Area type="monotone" dataKey="renegociacao" stroke="#F59E0B" fill="url(#gReneg)" strokeWidth={2} name="Renegociação" />
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
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {donutData.map((d: any, i: number) => (
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
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {ranking_categorias.map((cat: any, i: number) => (
              <div key={cat.name} className="flex items-center gap-3 py-1.5">
                <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                <span className="text-sm font-medium text-foreground flex-1">{cat.name}</span>
                <span className="text-sm font-semibold text-foreground w-24 text-right">{formatCurrency(cat.current)}</span>
                <div className={`flex items-center gap-0.5 w-16 justify-end text-xs font-medium ${cat.change > 0 ? 'text-danger' : cat.change < 0 ? 'text-success' : 'text-muted-foreground'
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
          <p className="text-3xl font-bold text-foreground -mt-8">{indicadores.taxa_poupanca_perc}%</p>
          <p className="text-xs text-success font-medium mt-1">Taxa Saudável</p>
        </Card>

        <Card className="p-5 card-shadow">
          <h3 className="text-sm font-semibold text-foreground mb-4">Comprometimento de Receitas</h3>
          <p className="text-3xl font-bold text-foreground text-center mb-4">{indicadores.comprometimento_renda_perc}%</p>
          <div className="h-4 rounded-full overflow-hidden flex bg-secondary">
            <div className="bg-danger h-full" style={{ width: `${indicadores.comprometimento_renda_perc}%` }} />
          </div>
          <div className="flex justify-center mt-2 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger" /> Renda Fatiada e Paga</div>
          </div>
        </Card>

        <Card className="p-5 card-shadow">
          <h3 className="text-sm font-semibold text-foreground mb-2">Projeção de Saldo</h3>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={projecao_saldo}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Line
                type="monotone" dataKey="saldo" stroke="#1B3A6B" strokeWidth={2}
                strokeDasharray="0" dot={{ r: 3 }}
                name="Real"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted-foreground text-center mt-1">
            <span className="inline-block w-6 border-b-2 border-primary mr-1 align-middle" />
            Meses reais
            <span className="inline-block w-6 border-b-2 border-primary border-dashed mx-2 align-middle" />
            Projeção (média 3 meses)
          </p>
        </Card>
      </div >

      {/* Export buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-md border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <FileText className="w-4 h-4" /> Exportar PDF
        </button>
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-md border border-green-500/30 text-green-500 hover:bg-green-500/10 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
        </button>
        <button
          onClick={handleCompartilhar}
          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-md border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 transition-colors"
        >
          <Share2 className="w-4 h-4" /> Compartilhar
        </button>
      </div>
    </AppLayout >
  );
}
