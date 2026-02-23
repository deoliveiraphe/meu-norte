import { useNavigate, useLocation } from 'react-router-dom';
import { Bot, X } from 'lucide-react';
import { useState } from 'react';

export function FloatingAIButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hovered, setHovered] = useState(false);

  if (location.pathname === '/assistente') return null;

  return (
    <button
      onClick={() => navigate('/assistente')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
      style={{ padding: hovered ? '14px 20px' : '14px' }}
    >
      <Bot className="w-5 h-5" />
      <span className={`text-sm font-semibold overflow-hidden transition-all duration-300 whitespace-nowrap ${hovered ? 'max-w-[120px] opacity-100' : 'max-w-0 opacity-0'}`}>
        Assistente IA
      </span>
      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive border-2 border-card animate-pulse" />
    </button>
  );
}
