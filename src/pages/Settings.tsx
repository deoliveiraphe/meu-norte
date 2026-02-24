import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Settings as SettingsIcon, LayoutGrid, AlertCircle, User, Mail, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from '@/contexts/AuthContext';

interface Category {
    id: number;
    nome: string;
    tipo: 'receita' | 'despesa' | 'renegociacao';
    icone: string;
}

const COMMON_ICONS = ["🏷️", "🍔", "🚗", "🏠", "💊", "📚", "🎮", "💼", "💸", "💳", "🛒", "✈️"];

export default function Settings() {
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);

    // Form States
    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState<'receita' | 'despesa' | 'renegociacao'>('despesa');
    const [icone, setIcone] = useState('🏷️');
    const [errorMsg, setErrorMsg] = useState('');

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await api.get('/categorias');
            setCategories(data);
        } catch (err) {
            console.error("Erro ao carregar categorias", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const openNew = () => {
        setEditingCat(null);
        setNome('');
        setTipo('despesa');
        setIcone('🏷️');
        setErrorMsg('');
        setModalOpen(true);
    };

    const openEdit = (cat: Category) => {
        setEditingCat(cat);
        setNome(cat.nome);
        setTipo(cat.tipo);
        setIcone(cat.icone);
        setErrorMsg('');
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!nome.trim()) {
            setErrorMsg("O nome da categoria é obrigatório.");
            return;
        }

        setErrorMsg('');
        const payload = { nome, tipo, icone };

        try {
            if (editingCat) {
                await api.put(`/categorias/${editingCat.id}`, payload);
            } else {
                await api.post('/categorias', payload);
            }
            await loadCategories();
            setModalOpen(false);
        } catch (err: any) {
            setErrorMsg(err.message || "Erro ao salvar categoria.");
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Tem certeza que deseja excluir esta categoria?")) {
            try {
                await api.delete(`/categorias/${id}`);
                await loadCategories();
            } catch (err: any) {
                alert(err.message || "Erro ao excluir categoria.");
            }
        }
    };

    const receitas = categories.filter(c => c.tipo === "receita");
    const despesas = categories.filter(c => c.tipo === "despesa");
    const renegociacoes = categories.filter(c => c.tipo === "renegociacao");

    const renderCategoryList = (list: Category[], title: string) => (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" /> {title} ({list.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {list.map(c => (
                    <Card key={c.id} className="p-3 border border-border bg-card/50 hover:bg-card transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg shadow-sm">
                                {c.icone}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">{c.nome}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{c.tipo}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(c)} className="p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground rounded-md transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(c.id)} className="p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger rounded-md transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );

    return (
        <AppLayout showMonthSelector={false}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <SettingsIcon className="w-6 h-6 text-primary" /> Configurações
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Gerencie sua conta, preferências e categorias de lançamento.</p>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" /> Sua Conta
                </h3>
                <Card className="p-6 border border-border bg-card/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex flex-col items-center justify-center text-primary font-bold shadow-inner">
                            <span className="text-2xl">{user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-xl font-bold text-foreground">{user?.nome || 'Usuário'}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="w-3.5 h-3.5" /> {user?.email || 'email@exemplo.com'}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm bg-success/10 text-success px-3 py-1.5 rounded-full border border-success/20">
                        <ShieldCheck className="w-4 h-4" /> Conta Autenticada
                    </div>
                </Card>
            </div>

            <div className="flex items-center justify-between mb-4 border-t border-border pt-8">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-primary" /> Categorias Personalizadas
                </h3>
                <Button onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm rounded-xl">
                    <Plus className="w-4 h-4" /> Nova Categoria
                </Button>
            </div>

            {loading ? (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground animate-pulse">Carregando dados...</div>
            ) : (
                <div className="space-y-8">
                    {receitas.length > 0 && renderCategoryList(receitas, "Categorias de Receita")}
                    {despesas.length > 0 && renderCategoryList(despesas, "Categorias de Despesa")}
                    {renegociacoes.length > 0 && renderCategoryList(renegociacoes, "Categorias de Renegociação")}

                    {categories.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-xl bg-card/20">
                            Nenhuma categoria encontrada. Crie a sua primeira!
                        </div>
                    )}
                </div>
            )}

            {/* Modal Categoria */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingCat ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                    </DialogHeader>

                    {errorMsg && (
                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex gap-2 items-center">
                            <AlertCircle className="w-4 h-4" /> {errorMsg}
                        </div>
                    )}

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Nome</label>
                            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Moradia, Salário, Lazer" />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Tipo</label>
                            <Select value={tipo} onValueChange={(val: any) => setTipo(val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="despesa">Despesa (Saída)</SelectItem>
                                    <SelectItem value="receita">Receita (Entrada)</SelectItem>
                                    <SelectItem value="renegociacao">Renegociação</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Ícone</label>
                            <div className="flex flex-wrap gap-2">
                                {COMMON_ICONS.map(i => (
                                    <button
                                        key={i}
                                        onClick={() => setIcone(i)}
                                        className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${icone === i ? 'bg-primary text-primary-foreground shadow-md scale-110' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                                    >
                                        {i}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                            {editingCat ? 'Salvar Alterações' : 'Criar Categoria'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
