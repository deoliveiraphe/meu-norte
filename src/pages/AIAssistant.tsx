import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Send, Paperclip, ChevronDown, ChevronUp, Bot, User, FileText } from 'lucide-react';
import { mockConversations, mockExpenseCategories, type ChatMessage, type Conversation } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
                  <span className="text-xs font-semibold text-foreground">Fonte {i + 1} — {s.title}</span>
                  <span className="text-[10px] font-medium text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">{s.relevance}%</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">"{s.excerpt}"</p>
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
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-primary' : 'bg-accent/10'
      }`}>
        {isUser ? <User className="w-4 h-4 text-primary-foreground" /> : <Bot className="w-4 h-4 text-accent" />}
      </div>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
        isUser ? 'bg-primary text-primary-foreground' : 'bg-card card-shadow'
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
  const [conversations] = useState<Conversation[]>(mockConversations);
  const [activeConv, setActiveConv] = useState(conversations[0]);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(activeConv.messages);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const userMsg: ChatMessage = { id: `u${Date.now()}`, role: 'user', content: inputValue, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `a${Date.now()}`, role: 'assistant', timestamp: new Date(),
        content: 'Analisei seus dados financeiros. Com base nos seus lançamentos, posso te ajudar a otimizar seus gastos. Deseja que eu aprofunde em alguma categoria específica?',
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1200);
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
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-1.5" size="sm">
                <Plus className="w-4 h-4" /> Nova Conversa
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => { setActiveConv(conv); setMessages(conv.messages); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeConv.id === conv.id ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:bg-secondary/50'
                  }`}
                >
                  <p className="truncate">{conv.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{conv.date}</p>
                </button>
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
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="px-4 lg:px-6 py-4 border-t border-border bg-card/50">
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
