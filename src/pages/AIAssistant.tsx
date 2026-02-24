import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Send, Paperclip, ChevronDown, ChevronUp, Bot, User, FileText, Trash2 } from 'lucide-react';
import { mockExpenseCategories } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';

interface SourceType {
  id: number;
  conteudo: string;
  data: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: SourceType[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chart?: any;
}

export interface Conversation {
  id: number;
  titulo: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mensagens: any[]; // ignorar o deep type por enquanto
}

function SourcesPanel({ sources }: { sources: ChatMessage['sources'] }) {
  const [open, setOpen] = useState(false);
  if (!sources?.length) return null;

  return (
    <div className="mt-3">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-xs font-medium text-primary/70 hover:text-primary transition-colors">
        📚 Fontes consultadas ({sources.length})
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-[400px] mt-2' : 'max-h-0'}`}>
        <div className="rounded-lg p-3 space-y-2 bg-primary/5">
          {sources.map((s, i) => (
            <div key={i} className="bg-card rounded-md p-3 border-l-[3px] border-l-primary/60 border border-border flex gap-3 items-start">
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground">Lançamento {s.id}</span>
                  <span className="text-[10px] font-medium text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">{s.data}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">"{s.conteudo}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InlineChart() {
  const top5 = mockExpenseCategories.slice(0, 5);
  return (
    <div className="mt-3 bg-secondary/50 rounded-lg p-3">
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={top5} layout="vertical" margin={{ left: 10, right: 10 }}>
          <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${v}`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
          <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
            {top5.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} slide-up`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-primary' : 'bg-accent/10'
        }`}>
        {isUser ? <User className="w-4 h-4 text-primary-foreground" /> : <Bot className="w-4 h-4 text-accent" />}
      </div>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-card card-shadow'
        }`}>
        <div className="text-sm whitespace-pre-line leading-relaxed">
          {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </div>
        {msg.chart && <InlineChart />}
        {msg.sources && <SourcesPanel sources={msg.sources} />}
      </div>
    </div>
  );
}

const suggestionChips = [
  '📊 Analisar meus gastos de janeiro',
  '⚠️ Quais contas vencem essa semana?',
  '💡 Como posso economizar mais?',
  '📈 Comparar com dezembro',
];

export default function AIAssistant() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  // Custom WebSocket Hook
  const { messages, isConnected, isTyping, statusText, sendMessage, loadHistory } = useChatWebSocket(activeConv?.id || null);

  useEffect(() => {
    // 1. Carregar Histórico Sidebar
    const fetchConversations = async () => {
      try {
        const data = await api.get('/chat/conversas');
        setConversations(data);
        if (data.length > 0) {
          setActiveConv(data[0]);
        }
      } catch (err) {
        console.error("Erro ao puxar conversas", err);
      }
    };
    fetchConversations();
  }, []);

  // Sync active conv history into Hook's Visual State
  useEffect(() => {
    if (activeConv && activeConv.mensagens) {
      loadHistory(activeConv.mensagens);
    } else {
      loadHistory([]);
    }
  }, [activeConv, loadHistory]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleCreateConversation = async () => {
    try {
      const novaSession = await api.post('/chat/conversas', { titulo: "Nova Conversa " + new Date().toLocaleTimeString() });
      setConversations(prev => [novaSession, ...prev]);
      setActiveConv(novaSession);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/chat/conversas/${id}`);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConv?.id === id) {
        setActiveConv(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() || !activeConv) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleChip = (chip: string) => {
    setInputValue(chip);
  };

  return (
    <AppLayout showMonthSelector={false}>
      <div className="flex h-[calc(100vh-2rem)] lg:h-[calc(100vh-2rem)] gap-4 -mt-4 lg:-mt-8 -mx-4 lg:-mx-8 p-0">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="hidden md:flex w-[280px] flex-shrink-0 flex-col bg-card border-r border-border">
            <div className="p-4 border-b border-border">
              <Button onClick={handleCreateConversation} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-1.5" size="sm">
                <Plus className="w-4 h-4" /> Nova Conversa
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer flex justify-between items-center group ${activeConv?.id === conv.id ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:bg-secondary/50'
                    }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="truncate">{conv.titulo}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(conv.updated_at || conv.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                  <button onClick={(e) => handleDeleteConversation(conv.id, e)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-danger/10 hover:text-danger rounded transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 lg:px-6 py-3 border-b border-border bg-card/50">
            <Bot className="w-5 h-5 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Assistente Financeiro IA</h2>
            <Badge className="bg-primary/10 text-primary text-[10px] hover:bg-primary/10">GPT-4o</Badge>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 space-y-4">
            {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}

            {/* Suggestion chips after welcome */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pl-11">
                {suggestionChips.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleChip(chip)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-card hover:bg-secondary transition-colors text-foreground"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
            {/* Is Typing Status Text */}
            {isTyping && (
              <div className="flex gap-2 items-center text-primary/70 slide-up pl-1.5 pt-2">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="text-xs font-semibold animate-pulse">{statusText || "Digitando..."}</span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="px-4 lg:px-6 py-4 border-t border-border bg-card/50">
            {!isConnected && activeConv && (
              <div className="text-xs text-danger font-medium animate-pulse mb-2 text-center">Reconectando servidor IA...</div>
            )}
            <div className="flex items-end gap-2 max-w-3xl mx-auto">
              <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground flex-shrink-0">
                <Paperclip className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Pergunte sobre seus gastos, vencimentos, metas..."
                  rows={1}
                  className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>
              <Button onClick={handleSend} size="icon" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl flex-shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">O assistente tem acesso aos seus lançamentos e histórico financeiro</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
