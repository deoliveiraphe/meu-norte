# 🎨 Frontend — Guia de Desenvolvimento

## Stack

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18 | UI declarativa com hooks |
| TypeScript | 5.0 | Tipagem estática |
| Vite | 5.x | Build + HMR |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui | latest | Componentes acessíveis |
| Recharts | 2.x | Gráficos interativos |
| Zustand | 4.x | State management global |
| React Router | 6.x | Roteamento SPA |
| Sonner | 1.x | Toast notifications |
| jsPDF | 2.x | Geração de PDF no browser |
| SheetJS (xlsx) | 0.18 | Exportação Excel |

---

## Estrutura de Pastas

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx       # Wrapper de página com sidebar
│   │   ├── AppSidebar.tsx      # Sidebar colapsável (desktop + mobile)
│   │   └── MonthSelector.tsx   # Seletor mês/ano global
│   └── ui/                     # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── sonner.tsx          # Toaster configurado
│       └── ...
│
├── contexts/
│   └── AuthContext.tsx         # Estado global de autenticação
│
├── hooks/
│   └── useChatWebSocket.ts     # Hook para WebSocket do chat
│
├── lib/
│   ├── api.ts                  # HTTP client com auth automático
│   └── exportUtils.ts          # PDF, Excel e compartilhar
│
├── pages/
│   ├── Login.tsx               # Página de login
│   ├── Register.tsx            # Página de registro
│   ├── Dashboard.tsx           # Dashboard com KPIs e gráficos
│   ├── Transactions.tsx        # CRUD de lançamentos
│   ├── Reports.tsx             # Relatórios e analytics
│   ├── AIAssistant.tsx         # Chat com IA
│   └── Settings.tsx            # Configurações e categorias
│
├── stores/
│   └── useFinanceStore.ts      # Zustand: currentMonth, currentYear
│
└── data/
    └── mockData.ts             # Types e helper formatCurrency
```

---

## api.ts — Client HTTP

O `fetchWithAuth` injeta automaticamente o Bearer token e trata 401:

```typescript
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('@MeuNorte:token');
    
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    });

    if (response.status === 401) {
        // Token expirado → limpa sessão e redireciona
        localStorage.removeItem('@MeuNorte:token');
        window.location.href = '/login';
    }
    // ...
}
```

---

## Exportações (exportUtils.ts)

### PDF — jsPDF + autotable
```typescript
export function exportToPDF(transactions: Transaction[], mes: string) {
    const doc = new jsPDF({ orientation: 'landscape' });
    // Header com totais por tipo
    // Tabela com autoTable (cores por tipo/status)
    doc.save(`meu-norte-lancamentos-${mes}.pdf`);
    toast.success('PDF exportado com sucesso!');
}
```

### Excel — SheetJS
```typescript
export function exportToExcel(transactions: Transaction[], mes: string) {
    const rows = transactions.map(t => ({ Tipo, Descrição, Valor, ... }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.writeFile(wb, `meu-norte-lancamentos-${mes}.xlsx`);
    toast.success('Excel exportado com sucesso!');
}
```

### Compartilhar — Web Share API + Clipboard
```typescript
export async function compartilharResumo(transactions, mes) {
    if (navigator.share) {
        await navigator.share({ title, text });
    } else {
        await navigator.clipboard.writeText(text);
        toast.success('Copiado para a área de transferência! 📋');
    }
}
```

---

## Zustand — Finance Store

```typescript
// stores/useFinanceStore.ts
interface FinanceStore {
    currentMonth: number;  // 0-indexed (0=Janeiro)
    currentYear: number;
    setMonth: (month: number) => void;
    setYear: (year: number) => void;
}

// Uso em qualquer componente:
const { currentMonth, currentYear } = useFinanceStore();
```

---

## Padrões de Componentes

### Página com dados da API
```typescript
export default function MyPage() {
    const { currentMonth, currentYear } = useFinanceStore();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/minha-rota?mes=${currentMonth + 1}&ano=${currentYear}`)
            .then(setData)
            .finally(() => setLoading(false));
    }, [currentMonth, currentYear]);

    if (loading || !data) return <LoadingSpinner />;
    return <AppLayout>...</AppLayout>;
}
```

---

## Comandos Úteis

```bash
# Dev server
npm run dev

# Type check
npx tsc --noEmit

# Build produção
npm run build

# Preview do build
npm run preview
```
