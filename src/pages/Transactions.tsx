import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, AlertTriangle, ArrowUp, ArrowDown, ArrowUpDown, CheckCircle2, TrendingUp, TrendingDown, FileText, FileSpreadsheet, Share2 } from 'lucide-react';
import { formatCurrency, type Transaction } from '@/data/mockData';
import { api } from '@/lib/api';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { exportToPDF, exportToExcel, compartilharResumo } from '@/lib/exportUtils';

interface Category {
  id: number;
  nome: string;
  tipo: 'receita' | 'despesa' | 'renegociacao';
  icone: string;
}

export default function Transactions() {
  const { currentMonth, currentYear } = useFinanceStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [apiCategories, setApiCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [categoriaFilter, setCategoriaFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [tipoNovo, setTipoNovo] = useState<'receita' | 'despesa' | 'renegociacao'>('despesa');

  // State for Editing
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Form states
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // State for Multi-select & Deleting
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [transactionsToDelete, setTransactionsToDelete] = useState<number[]>([]);

  // State for Repetition
  const [mesesSelecionados, setMesesSelecionados] = useState<number[]>([]);
  const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // State for Installments (Parcelas)
  const [qtdParcelas, setQtdParcelas] = useState<number>(1);
  const [ancoraDia, setAncoraDia] = useState<'original' | 'primeiro' | 'ultimo'>('original');
  const [applyToGroup, setApplyToGroup] = useState(false);

  // Fetch logic
  useEffect(() => {
    carregarLancamentos();
  }, []);

  // Sort and Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'vencimento', direction: 'asc' });

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [currentMonth, currentYear, search, tipoFilter, categoriaFilter, statusFilter]);

  const toggleStatus = async (transaction: Transaction) => {
    try {
      const novoStatus = transaction.status === 'pago' ? false : true;
      const payload = {
        is_pago: novoStatus
      };
      await api.put(`/lancamentos/${transaction.id}`, payload);
      await carregarLancamentos();
    } catch (e) {
      console.error("Erro ao alterar status", e);
    }
  };

  const carregarLancamentos = async () => {
    try {
      const [data, cats] = await Promise.all([
        api.get('/lancamentos?limit=1000'),
        api.get('/categorias')
      ]);
      setApiCategories(cats);
      // converter do backend pro layout Transaction
      const formatted = data.map((item: any) => ({
        id: item.id,
        descricao: item.descricao,
        categoria: item.categoria?.nome || 'Outros',
        categoriaEmoji: item.categoria?.icone || '💳',
        tipo: item.tipo,
        vencimento: item.data_vencimento,
        pagamento: item.data_pagamento,
        valor: typeof item.valor === 'string' ? parseFloat(item.valor) : item.valor,
        status: item.is_pago ? 'pago' : 'pendente',
        recorrencia: 'Única',
        observacoes: item.observacoes,
        parcela_group_id: item.parcela_group_id
      }));
      setTransactions(formatted);
    } catch (error) {
      console.error('Erro ao buscar lançamentos', error);
      // Fallback UI or toast in a real app
    }
  };
  const filtered = transactions.filter((t) => {
    // Filtro do Mês e Ano Superior
    if (t.vencimento) {
      const [anoStr, mesStr] = t.vencimento.split('-');
      const ano = parseInt(anoStr, 10);
      const mes = parseInt(mesStr, 10) - 1; // 0-indexed para bater com o Zustand

      if (ano !== currentYear || mes !== currentMonth) return false;
    }

    if (search && !t.descricao.toLowerCase().includes(search.toLowerCase())) return false;
    if (tipoFilter !== 'todos' && t.tipo !== tipoFilter) return false;
    if (categoriaFilter !== 'Todos' && t.categoria !== categoriaFilter) return false;
    if (statusFilter !== 'todos' && t.status !== statusFilter) return false;
    return true;
  });

  // Filter by Type
  const receitasFiltered = filtered.filter(t => t.tipo === 'receita');
  const despesasFiltered = filtered.filter(t => t.tipo === 'despesa');
  const renegociacoesFiltered = filtered.filter(t => t.tipo === 'renegociacao');

  // Sorting logic helper
  const sortData = (data: Transaction[]) => {
    const sorted = [...data];
    if (sortConfig !== null) {
      sorted.sort((a, b) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let aValue: any = a[sortConfig.key as keyof Transaction];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let bValue: any = b[sortConfig.key as keyof Transaction];

        if (sortConfig.key === 'valor') {
          aValue = Number(aValue);
          bValue = Number(bValue);
        } else if (sortConfig.key === 'vencimento') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        } else {
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;

        // Desempate de Ordenação
        if (sortConfig.key === 'vencimento') {
          // Se Vencimento for o critério e empatar (mesmo dia), desempata por Ordem Alfabética da Descrição
          const aDesc = String(a.descricao).toLowerCase();
          const bDesc = String(b.descricao).toLowerCase();
          if (aDesc < bDesc) return -1;
          if (aDesc > bDesc) return 1;
        } else if (sortConfig.key !== 'vencimento' && a.vencimento && b.vencimento) {
          // Se o critério for alfabético, de categoria etc e empatar, desempata pelo Vencimento mais próximo
          const aDate = new Date(a.vencimento).getTime();
          const bDate = new Date(b.vencimento).getTime();
          if (aDate < bDate) return -1;
          if (aDate > bDate) return 1;
        }

        return 0;
      });
    }
    return sorted;
  };

  const sortedReceitas = sortData(receitasFiltered);
  const sortedRenegociacoes = sortData(renegociacoesFiltered);
  const sortedDespesas = sortData(despesasFiltered);

  // Pagination logic only for Despesas
  const totalPages = Math.ceil(sortedDespesas.length / itemsPerPage);
  const paginatedDespesas = sortedDespesas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (keyName: string) => {
    if (sortConfig?.key === keyName) {
      return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 inline" /> : <ArrowDown className="w-3 h-3 ml-1 inline" />;
    }
    return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-40 hover:opacity-100 transition-opacity" />;
  };

  const toggleSelectAll = () => {
    if (selectedTransactions.length === filtered.length && filtered.length > 0) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filtered.map(t => t.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedTransactions.includes(id)) {
      setSelectedTransactions(selectedTransactions.filter(t => t !== id));
    } else {
      setSelectedTransactions([...selectedTransactions, id]);
    }
  };

  const confirmDelete = async () => {
    if (transactionsToDelete.length > 0) {
      try {
        const tx = transactions.find(t => t.id === transactionsToDelete[0]);
        if (transactionsToDelete.length === 1 && tx?.parcela_group_id && applyToGroup) {
          await api.delete(`/lancamentos/${tx.id}?delete_all=true`);
        } else {
          await Promise.all(transactionsToDelete.map(id => api.delete(`/lancamentos/${id}`)));
        }
        await carregarLancamentos(); // recarrega a tabela limpa
        setSelectedTransactions(selectedTransactions.filter(id => !transactionsToDelete.includes(id)));
        setTransactionsToDelete([]);
        setApplyToGroup(false);
      } catch (error) {
        console.error('Erro ao deletar: ', error);
      }
    }
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setTipoNovo(transaction.tipo);
    setDescricao(transaction.descricao);
    setValor(transaction.valor.toString());
    setCategoria(transaction.categoria);
    setVencimento(transaction.vencimento);
    setObservacoes(transaction.observacoes || '');
    setApplyToGroup(false);
    setModalOpen(true);
  };

  const openNewModal = () => {
    setEditingTransaction(null);
    setTipoNovo('despesa');
    setDescricao('');
    setValor('');
    setCategoria('Outros');
    setVencimento(new Date().toISOString().split('T')[0]); // Hoje formato yyyy-mm-dd
    setObservacoes('');
    setMesesSelecionados([]);
    setQtdParcelas(1);
    setAncoraDia('original');
    setApplyToGroup(false);
    setModalOpen(true);
  };

  const totalReceitas = transactions.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
  const totalDespesas = transactions.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);

  const handleSave = async () => {
    const dataInicialStr = vencimento || new Date().toISOString().split('T')[0];

    // Procura a categoria pela String nome da combobox na arvore dinamica
    const foundCat = apiCategories.find(c => c.nome === categoria);
    let catId = foundCat?.id;

    // Fallback improvisado se nao encontrar
    if (!catId) catId = (tipoNovo === 'receita' ? 9 : 8);

    const valFloat = parseFloat(valor) || 0;

    // Lista de payloads que serão enviadas
    const payloads = [];

    // Tratamento de Desepesa Parcelada
    if (tipoNovo === 'despesa' && !editingTransaction && qtdParcelas > 1) {
      const [anoStr, mesStr, diaStr] = dataInicialStr.split('-');
      const anoOriginal = parseInt(anoStr, 10);
      const mesOriginal = parseInt(mesStr, 10) - 1;
      const diaOriginal = parseInt(diaStr, 10);
      const groupId = crypto.randomUUID();

      for (let i = 0; i < qtdParcelas; i++) {
        // Incrementa o Mês de forma robusta
        const anoAlvo = anoOriginal + Math.floor((mesOriginal + i) / 12);
        const mesAlvo = (mesOriginal + i) % 12;

        // Calcula o dia alvo de acordo com a âncora selecionada
        const ultimoDiaMesAlvo = new Date(anoAlvo, mesAlvo + 1, 0).getDate();
        let diaAlvo: number;
        if (ancoraDia === 'primeiro') {
          diaAlvo = 1;
        } else if (ancoraDia === 'ultimo') {
          diaAlvo = ultimoDiaMesAlvo;
        } else {
          diaAlvo = Math.min(diaOriginal, ultimoDiaMesAlvo);
        }

        const diaFormatado = String(diaAlvo).padStart(2, '0');
        const mesFormatado = String(mesAlvo + 1).padStart(2, '0');
        const dataParcela = `${anoAlvo}-${mesFormatado}-${diaFormatado}`;
        const descParcela = `${descricao || 'Novo Lançamento'} (${i + 1}/${qtdParcelas})`;

        let obsFinal = observacoes || undefined;
        if (i === qtdParcelas - 1) {
          obsFinal = observacoes ? `${observacoes} - Última Parcela` : 'Última Parcela';
        }

        payloads.push({
          tipo: tipoNovo,
          descricao: descParcela,
          valor: valFloat,
          data_vencimento: dataParcela,
          categoria_id: catId,
          observacoes: obsFinal,
          is_pago: false,
          parcela_group_id: groupId
        });
      }
    } else {
      // Receita Multi-Select Mês OU Despesa Única OU Edição
      payloads.push({
        tipo: tipoNovo,
        descricao: descricao || 'Novo Lançamento',
        valor: valFloat,
        data_vencimento: dataInicialStr,
        categoria_id: catId,
        observacoes: observacoes || undefined,
        is_pago: false
      });
    }

    // Se houver repetições selecionadas E for receita nova
    if (tipoNovo === 'receita' && !editingTransaction && mesesSelecionados.length > 0) {
      const [anoStr, mesStr, diaStr] = dataInicialStr.split('-');
      const anoOriginal = parseInt(anoStr, 10);
      const diaOriginal = parseInt(diaStr, 10);
      const groupId = crypto.randomUUID();

      // Associa as do frontend também ao group id original, e altera a primeira inserida (Index 0)
      payloads[0].parcela_group_id = groupId;

      mesesSelecionados.forEach(mesIndex => {
        // Ignora se o mês selecionado for EXATAMENTE o mês da data inicial
        if (mesIndex + 1 !== parseInt(mesStr, 10)) {
          // Constrói a data respeitando o último dia do mês
          const ultimoDiaMesAlvo = new Date(anoOriginal, mesIndex + 1, 0).getDate();
          const diaAlvo = Math.min(diaOriginal, ultimoDiaMesAlvo);

          const diaFormatado = String(diaAlvo).padStart(2, '0');
          const mesFormatado = String(mesIndex + 1).padStart(2, '0');
          const dataRepeticao = `${anoOriginal}-${mesFormatado}-${diaFormatado}`;

          payloads.push({
            tipo: tipoNovo,
            descricao: descricao || 'Novo Lançamento',
            valor: valFloat,
            data_vencimento: dataRepeticao,
            categoria_id: catId,
            observacoes: observacoes || undefined,
            is_pago: false,
            parcela_group_id: groupId
          });
        }
      });
    }

    try {
      if (editingTransaction) {
        let updateUrl = `/lancamentos/${editingTransaction.id}`;
        if (applyToGroup && editingTransaction.parcela_group_id) {
          updateUrl += '?update_all=true';
        }
        await api.put(updateUrl, payloads[0]);
      } else {
        await Promise.all(payloads.map(p => api.post('/lancamentos', p)));
      }
      await carregarLancamentos();
      setModalOpen(false);
    } catch (e) {
      console.error("Failed to save", e);
      // Aqui em vez de error.detail mostrariamos toast no app
    }
  };

  return (
    <AppLayout>
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar lançamento..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {selectedTransactions.length > 0 && (
          <Button
            variant="destructive"
            onClick={() => setTransactionsToDelete(selectedTransactions)}
            className="gap-1.5 whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Excluir</span> ({selectedTransactions.length})
          </Button>
        )}

        {/* Botões de Exportação */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const nomeMes = new Date(currentYear, currentMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
              exportToPDF(filtered, nomeMes);
            }}
            className="gap-1.5 whitespace-nowrap border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400"
            title="Exportar PDF"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden md:inline">PDF</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const nomeMes = new Date(currentYear, currentMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
              exportToExcel(filtered, nomeMes);
            }}
            className="gap-1.5 whitespace-nowrap border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-400"
            title="Exportar Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden md:inline">Excel</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const nomeMes = new Date(currentYear, currentMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
              compartilharResumo(filtered, nomeMes);
            }}
            className="gap-1.5 whitespace-nowrap border-blue-500/30 text-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
            title="Compartilhar Resumo"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden md:inline">Compartilhar</span>
          </Button>
        </div>

        <Button onClick={openNewModal} className="bg-accent hover:bg-accent/90 text-accent-foreground gap-1.5 whitespace-nowrap">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo Lançamento</span><span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4 p-3 bg-muted/20 rounded-xl border border-border/40">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Tipo</span>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs bg-background"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="receita">📈 Receita</SelectItem>
              <SelectItem value="despesa">📉 Despesa</SelectItem>
              <SelectItem value="renegociacao">🔄 Renegociado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Categoria</span>
          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger className="w-[150px] h-9 text-xs bg-background"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">🗂️ Todas</SelectItem>
              {apiCategories.map(c => <SelectItem key={c.id} value={c.nome}>{c.icone} {c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Status</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs bg-background"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pago">✅ Pago</SelectItem>
              <SelectItem value="pendente">⏳ Pendente</SelectItem>
              <SelectItem value="vencido">🔴 Vencido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(tipoFilter !== 'todos' || categoriaFilter !== 'Todos' || statusFilter !== 'todos') && (
          <button
            onClick={() => { setTipoFilter('todos'); setCategoriaFilter('Todos'); setStatusFilter('todos'); }}
            className="h-9 px-3 text-[11px] font-medium text-muted-foreground hover:text-foreground border border-border/60 rounded-md bg-background hover:bg-secondary transition-colors self-end"
          >
            ✕ Limpar filtros
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <Card className="p-4 xl:p-6 bg-background rounded-xl border border-border/50 shadow-sm flex flex-col justify-between gap-2 overflow-hidden">
          <div>
            <p className="text-[11px] md:text-sm font-medium text-muted-foreground mb-1 truncate">Tot. Receitas Mês</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                <span className="text-success font-bold text-lg">↑</span>
              </div>
            </div>
          </div>
          <div className="text-left mt-1">
            <p className="text-base md:text-xl xl:text-2xl font-bold text-foreground truncate">
              {formatCurrency(filtered.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0))}
            </p>
          </div>
        </Card>

        <Card className="p-4 xl:p-6 bg-background rounded-xl border border-border/50 shadow-sm flex flex-col justify-between gap-2 overflow-hidden">
          <div>
            <p className="text-[11px] md:text-sm font-medium text-muted-foreground mb-1 truncate">Tot. Despesas Mês</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-destructive font-bold text-lg">↓</span>
              </div>
            </div>
          </div>
          <div className="text-left mt-1">
            <p className="text-base md:text-xl xl:text-2xl font-bold text-foreground truncate">
              {formatCurrency(filtered.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0))}
            </p>
          </div>
        </Card>

        <Card className="p-4 xl:p-6 bg-background rounded-xl border border-border/50 shadow-sm flex flex-col justify-between gap-2 overflow-hidden">
          <div>
            <p className="text-[11px] md:text-sm font-medium text-muted-foreground mb-1 truncate">Total Pago</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
            </div>
          </div>
          <div className="text-left mt-1">
            <p className="text-base md:text-xl xl:text-2xl font-bold text-foreground truncate">
              {formatCurrency(filtered.filter(t => t.tipo === 'despesa' && t.status === 'pago').reduce((s, t) => s + t.valor, 0))}
            </p>
          </div>
        </Card>

        <Card className="p-4 xl:p-6 bg-background rounded-xl border border-border/50 shadow-sm flex flex-col justify-between gap-2 overflow-hidden">
          <div>
            <p className="text-[11px] md:text-sm font-medium text-muted-foreground mb-1 truncate">Total Pendente</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              </div>
            </div>
          </div>
          <div className="text-left mt-1">
            <p className="text-base md:text-xl xl:text-2xl font-bold text-foreground truncate">
              {formatCurrency(filtered.filter(t => t.tipo === 'despesa' && t.status !== 'pago').reduce((s, t) => s + t.valor, 0))}
            </p>
          </div>
        </Card>

        <Card className="p-4 xl:p-6 bg-background rounded-xl border border-border/50 shadow-sm flex flex-col justify-between gap-2 overflow-hidden">
          <div>
            <p className="text-[11px] md:text-sm font-medium text-muted-foreground mb-1 truncate">Saldo no Mês</p>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${(filtered.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0) - filtered.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)) >= 0
                ? 'bg-primary/10'
                : 'bg-destructive/10'
                } flex items-center justify-center`}>
                <span className={`${(filtered.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0) - filtered.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)) >= 0
                  ? 'text-primary'
                  : 'text-destructive'
                  } font-bold text-lg`}>
                  {(filtered.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0) - filtered.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)) >= 0
                    ? '✓'
                    : '✗'}
                </span>
              </div>
            </div>
          </div>
          <div className="text-left mt-1">
            <p className="text-base md:text-xl xl:text-2xl font-bold text-foreground truncate">
              {formatCurrency(filtered.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0) - filtered.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0))}
            </p>
          </div>
        </Card>

        <Card className="p-4 xl:p-6 bg-background rounded-xl border border-border/50 shadow-sm flex flex-col justify-between gap-2 overflow-hidden">
          <div>
            <p className="text-[11px] md:text-sm font-medium text-muted-foreground mb-1 truncate">Total Renegociado</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                <span className="text-warning font-bold text-lg">🔄</span>
              </div>
            </div>
          </div>
          <div className="text-left mt-1">
            <p className="text-base md:text-xl xl:text-2xl font-bold text-foreground truncate">
              {formatCurrency(filtered.filter(t => t.tipo === 'renegociacao').reduce((s, t) => s + t.valor, 0))}
            </p>
          </div>
        </Card>
      </div>

      {/* Tabelas: Receitas, Renegociações e Despesas */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Receitas Table (Menor, sem paginação) */}
        <Card className="card-shadow overflow-hidden xl:col-span-6 self-start">
          <div className="px-4 py-3 border-b border-border bg-success/5 flex justify-between items-center">
            <h3 className="font-semibold text-success flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Receitas
            </h3>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              {sortedReceitas.length} itens
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="w-8 px-3 py-2 text-center">
                    <Checkbox
                      checked={selectedTransactions.filter(id => receitasFiltered.some(t => t.id === id)).length === receitasFiltered.length && receitasFiltered.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const newSelected = [...selectedTransactions, ...receitasFiltered.map(t => t.id)];
                          setSelectedTransactions(Array.from(new Set(newSelected)));
                        } else {
                          setSelectedTransactions(selectedTransactions.filter(id => !receitasFiltered.some(t => t.id === id)));
                        }
                      }}
                    />
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => requestSort('descricao')}>
                    Descrição {getSortIcon('descricao')}
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => requestSort('valor')}>
                    Valor {getSortIcon('valor')}
                  </th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedReceitas.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-4 text-muted-foreground text-xs">Nenhuma receita encontrada.</td></tr>
                ) : sortedReceitas.map((t) => (
                  <tr key={t.id} className={`border-b border-border hover:bg-success/5 transition-colors ${selectedTransactions.includes(t.id) ? 'bg-success/10' : ''}`}>
                    <td className="px-3 py-2 text-center">
                      <Checkbox
                        checked={selectedTransactions.includes(t.id)}
                        onCheckedChange={() => toggleSelect(t.id)}
                      />
                    </td>
                    <td className="px-3 py-2 text-left w-full max-w-[200px]">
                      <div className="font-medium text-foreground text-xs truncate">{t.descricao}</div>
                      {t.observacoes && <div className="text-[10px] text-muted-foreground truncate opacity-80 mt-0.5">{t.observacoes}</div>}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-success text-xs">
                      {formatCurrency(t.valor)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <button onClick={() => toggleStatus(t)} title={t.status === 'pago' ? "Desmarcar Recebimento" : "Marcar como Recebido"} className={`p-1 rounded-md transition-colors ${t.status === 'pago' ? 'text-success hover:bg-success/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEditModal(t)} title="Editar" className="p-1 rounded-md hover:bg-secondary transition-colors">
                          <Pencil className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button onClick={() => setTransactionsToDelete([t.id])} title="Excluir" className="p-1 rounded-md hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Renegociações Table */}
        <Card className="card-shadow overflow-hidden xl:col-span-6 self-start">
          <div className="px-4 py-3 border-b border-border bg-warning/5 flex justify-between items-center">
            <h3 className="font-semibold text-warning flex items-center gap-2">
              <span className="text-base">🔄</span> Renegociações
            </h3>
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
              {sortedRenegociacoes.length} itens
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="w-8 px-3 py-2 text-center">
                    <Checkbox
                      checked={selectedTransactions.filter(id => renegociacoesFiltered.some(t => t.id === id)).length === renegociacoesFiltered.length && renegociacoesFiltered.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const newSelected = [...selectedTransactions, ...renegociacoesFiltered.map(t => t.id)];
                          setSelectedTransactions(Array.from(new Set(newSelected)));
                        } else {
                          setSelectedTransactions(selectedTransactions.filter(id => !renegociacoesFiltered.some(t => t.id === id)));
                        }
                      }}
                    />
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => requestSort('descricao')}>
                    Descrição {getSortIcon('descricao')}
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => requestSort('valor')}>
                    Valor {getSortIcon('valor')}
                  </th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedRenegociacoes.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-4 text-muted-foreground text-xs">Nenhuma renegociação encontrada.</td></tr>
                ) : sortedRenegociacoes.map((t) => (
                  <tr key={t.id} className={`border-b border-border hover:bg-warning/5 transition-colors ${selectedTransactions.includes(t.id) ? 'bg-warning/10' : ''}`}>
                    <td className="px-3 py-2 text-center">
                      <Checkbox
                        checked={selectedTransactions.includes(t.id)}
                        onCheckedChange={() => toggleSelect(t.id)}
                      />
                    </td>
                    <td className="px-3 py-2 text-left w-full max-w-[200px]">
                      <div className="font-medium text-foreground text-xs truncate">{t.descricao}</div>
                      {t.observacoes && <div className="text-[10px] text-muted-foreground truncate opacity-80 mt-0.5">{t.observacoes}</div>}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-warning text-xs">
                      ≈ {formatCurrency(t.valor)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <button onClick={() => toggleStatus(t)} title={t.status === 'pago' ? "Desmarcar" : "Marcar como Pago"} className={`p-1 rounded-md transition-colors ${t.status === 'pago' ? 'text-success hover:bg-success/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEditModal(t)} title="Editar" className="p-1 rounded-md hover:bg-secondary transition-colors">
                          <Pencil className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button onClick={() => setTransactionsToDelete([t.id])} title="Excluir" className="p-1 rounded-md hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Despesas Table */}
        <Card className="card-shadow overflow-hidden xl:col-span-12">
          <div className="px-4 py-3 border-b border-border bg-destructive/5 flex justify-between items-center">
            <h3 className="font-semibold text-destructive flex items-center gap-2">
              <TrendingDown className="w-4 h-4" /> Despesas
            </h3>
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
              {despesasFiltered.length} itens totais
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="w-10 px-4 py-3 text-center">
                    <Checkbox
                      checked={selectedTransactions.filter(id => despesasFiltered.some(t => t.id === id)).length === despesasFiltered.length && despesasFiltered.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const newSelected = [...selectedTransactions, ...despesasFiltered.map(t => t.id)];
                          setSelectedTransactions(Array.from(new Set(newSelected)));
                        } else {
                          setSelectedTransactions(selectedTransactions.filter(id => !despesasFiltered.some(t => t.id === id)));
                        }
                      }}
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-12">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => requestSort('descricao')}>
                    Descrição {getSortIcon('descricao')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell cursor-pointer select-none" onClick={() => requestSort('categoria')}>
                    Categoria {getSortIcon('categoria')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell cursor-pointer select-none" onClick={() => requestSort('vencimento')}>
                    Vencimento {getSortIcon('vencimento')}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => requestSort('valor')}>
                    Valor {getSortIcon('valor')}
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => requestSort('status')}>
                    Status {getSortIcon('status')}
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDespesas.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-6 text-muted-foreground text-sm">Nenhuma despesa encontrada.</td></tr>
                ) : paginatedDespesas.map((t) => (
                  <tr key={t.id} className={`border-b border-border hover:bg-secondary/30 transition-colors ${selectedTransactions.includes(t.id) ? 'bg-primary/5' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      <Checkbox
                        checked={selectedTransactions.includes(t.id)}
                        onCheckedChange={() => toggleSelect(t.id)}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t.id}</td>
                    <td className="px-4 py-3 text-left max-w-[250px] overflow-hidden">
                      <div className="font-medium text-foreground text-sm truncate">{t.descricao}</div>
                      {t.observacoes && <div className="text-xs text-muted-foreground truncate opacity-85 mt-0.5">{t.observacoes}</div>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs">{t.categoriaEmoji} {t.categoria}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(t.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${t.tipo === 'receita' ? 'text-success' : t.tipo === 'renegociacao' ? 'text-warning' : 'text-danger'}`}>
                      {t.tipo === 'renegociacao' ? '≈ ' : t.tipo === 'despesa' ? '- ' : ''}{formatCurrency(t.valor)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={`text-[10px] font-semibold px-2 py-0.5 ${t.status === 'pago' ? 'bg-success-light text-success hover:bg-success-light' :
                        t.status === 'pendente' ? 'bg-warning-light text-warning hover:bg-warning-light' :
                          'bg-danger-light text-danger hover:bg-danger-light'
                        }`}>
                        {t.status === 'pago' ? 'Pago' : t.status === 'pendente' ? 'Pendente' : 'Vencido'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          onClick={() => toggleStatus(t)}
                          title={t.status === 'pago' ? "Desmarcar Recebimento" : "Marcar como Pago"}
                          className={`p-1.5 rounded-md transition-colors ${t.status === 'pago' ? 'text-success hover:bg-success/10' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(t)}
                          title="Editar"
                          className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => setTransactionsToDelete([t.id])}
                          title="Excluir"
                          className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-border gap-3">
            <span className="text-xs text-muted-foreground">
              Mostrando {paginatedDespesas.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
              {Math.min(currentPage * itemsPerPage, despesasFiltered.length)} de {despesasFiltered.length} resultados
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="w-7 h-7"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || totalPages === 0}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>

              {/* Simple Page Numbers */}
              {Array.from({ length: totalPages }).map((_, idx) => {
                const p = idx + 1;
                // Show max 5 page buttons to prevent overflow: First, Last, Current, Current-1, Current+1
                if (
                  p === 1 ||
                  p === totalPages ||
                  (p >= currentPage - 1 && p <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={p}
                      variant={currentPage === p ? "default" : "outline"}
                      size="sm"
                      className={`w-7 h-7 text-xs ${currentPage === p ? 'bg-primary text-primary-foreground' : ''}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </Button>
                  );
                } else if (
                  (p === currentPage - 2 && currentPage > 3) ||
                  (p === currentPage + 2 && currentPage < totalPages - 2)
                ) {
                  return React.createElement('span', { key: p, className: 'text-muted-foreground text-xs px-1' }, '...');
                }
                return null;
              })}

              <Button
                variant="outline"
                size="icon"
                className="w-7 h-7"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </Card >
      </div >

      {/* New Transaction Modal Refactored */}
      < Dialog open={modalOpen} onOpenChange={setModalOpen} >
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-border/50 shadow-2xl rounded-xl">
          <div className={`h-2 w-full ${tipoNovo === 'receita' ? 'bg-success' : 'bg-destructive'}`} />

          <div className="px-6 pt-6 pb-2">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {editingTransaction ? <Pencil className="w-5 h-5 text-muted-foreground" /> : <Plus className="w-5 h-5 text-muted-foreground" />}
                {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="px-6 py-4 space-y-5 bg-card/50">
            {/* Tipo Selector */}
            <div className="flex gap-2 p-1.5 bg-secondary/80 rounded-lg w-full">
              <button
                onClick={() => setTipoNovo('receita')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${tipoNovo === 'receita'
                  ? 'bg-success text-success-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
              >
                Receita
              </button>
              <button
                onClick={() => setTipoNovo('despesa')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${tipoNovo === 'despesa'
                  ? 'bg-destructive text-destructive-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
              >
                Despesa
              </button>
              <button
                onClick={() => setTipoNovo('renegociacao')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${tipoNovo === 'renegociacao'
                  ? 'bg-warning text-warning-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
              >
                Renegociação
              </button>
            </div>

            {/* Inputs Principais */}
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 sm:col-span-8">
                  <Label className="text-[13px] font-medium text-muted-foreground mb-1.5 block">Descrição</Label>
                  <Input
                    placeholder="Ex: Aluguel, Salário, Internet..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="h-11 bg-background"
                  />
                </div>
                <div className="col-span-12 sm:col-span-4">
                  <Label className="text-[13px] font-medium text-muted-foreground mb-1.5 block">
                    Valor <span className={tipoNovo === 'receita' ? 'text-success' : 'text-danger'}>*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      className="pl-9 h-11 bg-background font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 sm:col-span-6">
                  <Label className="text-[13px] font-medium text-muted-foreground mb-1.5 block">Categoria</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger className="h-11 bg-background">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {apiCategories.filter(c => c.tipo === tipoNovo).map(c => (
                        <SelectItem key={c.id} value={c.nome}>{c.icone} {c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <Label className="text-[13px] font-medium text-muted-foreground mb-1.5 block">Data de Vencimento</Label>
                  <Input
                    type="date"
                    value={vencimento}
                    onChange={(e) => setVencimento(e.target.value)}
                    className="h-11 bg-background"
                  />
                </div>
              </div>

              {/* Installments para Despesas e Renegociação Novas */}
              {(tipoNovo === 'despesa' || tipoNovo === 'renegociacao') && !editingTransaction && (
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 sm:col-span-6">
                    <Label className="text-[13px] font-medium text-muted-foreground mb-1.5 block">Quantidade de Parcelas</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={120}
                        value={qtdParcelas}
                        onChange={(e) => setQtdParcelas(parseInt(e.target.value) || 1)}
                        className="h-11 bg-background w-24"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">x parcelas fixas</span>
                    </div>
                  </div>
                  <div className="col-span-12 sm:col-span-6 flex items-center justify-start sm:justify-end">
                    {qtdParcelas > 1 && (
                      <span className="text-xs text-muted-foreground text-right bg-border/20 p-2 rounded-md">
                        Criaremos {qtdParcelas} despesas repetindo o valor nos meses seguintes.
                      </span>
                    )}
                  </div>
                  {qtdParcelas > 1 && (
                    <div className="col-span-12">
                      <Label className="text-[13px] font-medium text-muted-foreground mb-1.5 block">Vencimento das Parcelas</Label>
                      <Select value={ancoraDia} onValueChange={(v) => setAncoraDia(v as 'original' | 'primeiro' | 'ultimo')}>
                        <SelectTrigger className="h-11 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="original">📅 Mesmo dia da data escolhida</SelectItem>
                          <SelectItem value="primeiro">1️⃣ Sempre no 1º dia do mês</SelectItem>
                          <SelectItem value="ultimo">🔚 Sempre no último dia do mês</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {tipoNovo === 'receita' && !editingTransaction && (
                <div className="mt-2 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-[13px] font-medium text-foreground flex items-center gap-2">
                      Repetir nos meses (Opcional)
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        if (mesesSelecionados.length === 12) {
                          setMesesSelecionados([]);
                        } else {
                          setMesesSelecionados([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
                        }
                      }}
                      className={`text-[11px] font-medium px-3 py-1 rounded-full border transition-all duration-200 ${mesesSelecionados.length === 12
                        ? 'bg-success text-white border-success shadow-sm'
                        : 'bg-background border-border text-muted-foreground hover:border-success/50 hover:text-success'
                        }`}
                    >
                      {mesesSelecionados.length === 12 ? '✓ Todos os meses' : 'Todos os meses'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {nomesMeses.map((mes, index) => {
                      const isSelected = mesesSelecionados.includes(index);
                      return (
                        <div
                          key={mes}
                          onClick={() => {
                            if (isSelected) {
                              setMesesSelecionados(mesesSelecionados.filter(m => m !== index));
                            } else {
                              setMesesSelecionados([...mesesSelecionados, index]);
                            }
                          }}
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-medium cursor-pointer transition-all duration-200 ${isSelected
                            ? 'bg-success text-white shadow-sm scale-110'
                            : 'bg-background border border-border text-muted-foreground hover:border-success/50 hover:text-success'
                            }`}
                        >
                          {mes}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                    Selecione os meses nos quais esta receita ocorrerá <strong>automaticamente</strong> nos mesmos dias.
                  </p>
                </div>
              )}


              <div>
                <Label className="text-[13px] font-medium text-muted-foreground mb-1.5 block">Observações (Opcional)</Label>
                <Textarea
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  placeholder="Anotações adicionais sobre este lançamento..."
                  className="resize-none bg-background min-h-[80px]"
                />
              </div>

              {/* Checkbox de Editar Grupo */}
              {editingTransaction?.parcela_group_id && (
                <div className="flex items-start gap-3 mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="h-5 flex items-center">
                    <input
                      type="checkbox"
                      id="updateGroup"
                      checked={applyToGroup}
                      onChange={e => setApplyToGroup(e.target.checked)}
                      className="w-4 h-4 rounded border-primary text-primary focus:ring-primary/50"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="updateGroup" className="text-sm font-semibold text-foreground cursor-pointer">
                      Modificar todas as parcelas/meses juntos
                    </label>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      Atualiza o valor e a categoria dos eventos relacionados (preserva os meses originais).
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="px-6"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className={`px-8 ${tipoNovo === 'receita' ? 'bg-success hover:bg-success/90 text-white' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
            >
              Gravar Lançamento
            </Button>
          </div>
        </DialogContent>
      </Dialog >
      {/* Delete Confirmation Alert Dialog */}
      < AlertDialog open={transactionsToDelete.length > 0} onOpenChange={(open) => {
        if (!open) {
          setTransactionsToDelete([]);
          setApplyToGroup(false);
        }
      }
      }>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir {transactionsToDelete.length > 1 ? `${transactionsToDelete.length} lançamentos` : 'Lançamento'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {transactionsToDelete.length > 1
                ? `Tem certeza que deseja excluir os ${transactionsToDelete.length} lançamentos selecionados? Essa ação não pode ser desfeita.`
                : 'Tem certeza que deseja excluir esta transação? Essa ação não pode ser desfeita.'}
            </AlertDialogDescription>

            {/* Checkbox condicional para exclusão em lote */}
            {transactionsToDelete.length === 1 && transactions.find(t => t.id === transactionsToDelete[0])?.parcela_group_id && (
              <div className="flex items-start gap-3 mt-3 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                <div className="h-5 flex items-center">
                  <input
                    type="checkbox"
                    id="deleteGroup"
                    checked={applyToGroup}
                    onChange={e => setApplyToGroup(e.target.checked)}
                    className="w-4 h-4 rounded border-destructive text-destructive focus:ring-destructive/50"
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="deleteGroup" className="text-sm font-semibold text-foreground cursor-pointer">
                    Excluir todas as parcelas deste grupo
                  </label>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    Remove também os lançamentos futuros/passados gerados na mesma vez.
                  </span>
                </div>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog >

    </AppLayout >
  );
}
