import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockTransactions, formatCurrency, type Transaction } from '@/data/mockData';

const categories = ['Todos', 'Receita', 'Moradia', 'Transporte', 'Alimentação', 'Saúde', 'Lazer', 'Educação', 'Contas', 'Cartão', 'Outros'];

export default function Transactions() {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [categoriaFilter, setCategoriaFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [tipoNovo, setTipoNovo] = useState<'receita' | 'despesa'>('despesa');

  const filtered = mockTransactions.filter((t) => {
    if (search && !t.descricao.toLowerCase().includes(search.toLowerCase())) return false;
    if (tipoFilter !== 'todos' && t.tipo !== tipoFilter) return false;
    if (categoriaFilter !== 'Todos' && t.categoria !== categoriaFilter) return false;
    if (statusFilter !== 'todos' && t.status !== statusFilter) return false;
    return true;
  });

  const totalReceitas = mockTransactions.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
  const totalDespesas = mockTransactions.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);

  return (
    <AppLayout>
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar lançamento..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setModalOpen(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground gap-1.5">
          <Plus className="w-4 h-4" /> Novo Lançamento
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="receita">Receita</SelectItem>
            <SelectItem value="despesa">Despesa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
          <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="p-3 card-shadow text-center">
          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Total Receitas</p>
          <p className="text-lg font-bold text-success">{formatCurrency(totalReceitas)}</p>
        </Card>
        <Card className="p-3 card-shadow text-center">
          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Total Despesas</p>
          <p className="text-lg font-bold text-danger">{formatCurrency(totalDespesas)}</p>
        </Card>
        <Card className="p-3 card-shadow text-center">
          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Saldo</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(totalReceitas - totalDespesas)}</p>
        </Card>
      </div>

      {/* Table */}
      <Card className="card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Descrição</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Vencimento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Pagamento</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Valor</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{t.id}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{t.descricao}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs">{t.categoriaEmoji} {t.categoria}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{t.vencimento}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{t.pagamento || '—'}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${t.tipo === 'receita' ? 'text-success' : 'text-danger'}`}>
                    {t.tipo === 'despesa' ? '- ' : ''}{formatCurrency(t.valor)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge className={`text-[10px] font-semibold px-2 py-0.5 ${
                      t.status === 'pago' ? 'bg-success-light text-success hover:bg-success-light' :
                      t.status === 'pendente' ? 'bg-warning-light text-warning hover:bg-warning-light' :
                      'bg-danger-light text-danger hover:bg-danger-light'
                    }`}>
                      {t.status === 'pago' ? 'Pago' : t.status === 'pendente' ? 'Pendente' : 'Vencido'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground">Mostrando 1-{filtered.length} de 47 resultados</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="w-7 h-7"><ChevronLeft className="w-3.5 h-3.5" /></Button>
            <Button variant="outline" size="sm" className="w-7 h-7 text-xs bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="sm" className="w-7 h-7 text-xs">2</Button>
            <Button variant="outline" size="sm" className="w-7 h-7 text-xs">3</Button>
            <Button variant="outline" size="icon" className="w-7 h-7"><ChevronRight className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      </Card>

      {/* New Transaction Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs mb-1.5 block">Tipo</Label>
              <div className="flex gap-2">
                <Button variant={tipoNovo === 'receita' ? 'default' : 'outline'} size="sm" onClick={() => setTipoNovo('receita')}
                  className={tipoNovo === 'receita' ? 'bg-success hover:bg-success/90 text-success-foreground' : ''}>Receita</Button>
                <Button variant={tipoNovo === 'despesa' ? 'default' : 'outline'} size="sm" onClick={() => setTipoNovo('despesa')}
                  className={tipoNovo === 'despesa' ? 'bg-destructive hover:bg-destructive/90' : ''}>Despesa</Button>
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Descrição</Label>
              <Input placeholder="Ex: Aluguel, Salário..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Valor (R$)</Label>
                <Input type="number" placeholder="0,00" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Data de Vencimento</Label>
                <Input type="date" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Categoria</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moradia">🏠 Moradia</SelectItem>
                    <SelectItem value="alimentacao">🛒 Alimentação</SelectItem>
                    <SelectItem value="transporte">🚗 Transporte</SelectItem>
                    <SelectItem value="saude">💊 Saúde</SelectItem>
                    <SelectItem value="lazer">🎬 Lazer</SelectItem>
                    <SelectItem value="educacao">📚 Educação</SelectItem>
                    <SelectItem value="contas">💡 Contas</SelectItem>
                    <SelectItem value="outros">💳 Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Recorrência</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unica">Única</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Observações</Label>
              <Textarea placeholder="Anotações opcionais..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={() => setModalOpen(false)} className="bg-accent hover:bg-accent/90 text-accent-foreground">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
