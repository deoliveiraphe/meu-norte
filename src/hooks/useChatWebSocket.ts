import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '@/pages/AIAssistant';

// Este hook vai lidar com a conexão websocket bruta.
// Como o WS do navegador não suporta Custom Headers nativamente para Authorization,
// O backend fastapi foi modificado para suportar o Token via Query Params (?token=xxx)
export function useChatWebSocket(activeConvId: number | null) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [statusText, setStatusText] = useState('');

    const wsRef = useRef<WebSocket | null>(null);

    // Buffer para processar a resposta do Assistente em streaming.
    const currentAssistantMessageRef = useRef<ChatMessage | null>(null);

    const connect = useCallback(() => {
        if (!activeConvId) return;

        // Recupera o token do LocalStorage injetado pela rota de Login.
        const token = localStorage.getItem('token') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDM0MzU4NzMsInN1YiI6ImFkbWluQGZpbmFuY2VhaS5jb20ifQ.xcgFKlnxUUzRwnF61SYgY6aL7dw3KdlJ49j3blNu0Xw';
        if (!token) {
            console.error("Token JWT não encontrado. O Websocket não poderá conectar.");
            return;
        }

        const wsUrl = `ws://localhost:8000/api/v1/chat/ws/${activeConvId}?token=${token}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log(`[WS] Conectado na conversa ${activeConvId}`);
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'status') {
                    setStatusText(data.content);
                    setIsTyping(true);
                } else if (data.type === 'token') {
                    setIsTyping(false);
                    setStatusText(''); // apaga "Analisando..."

                    // O assistente está cuspindo palavras
                    setMessages((prev) => {
                        const draft = [...prev];
                        // Se ainda n tiver uma bolha pro assistente p/ esssa request, crie uma
                        if (!currentAssistantMessageRef.current) {
                            const newMsg: ChatMessage = {
                                id: `a${Date.now()}`,
                                role: 'assistant',
                                content: data.content,
                                timestamp: new Date()
                            };
                            currentAssistantMessageRef.current = newMsg;
                            return [...draft, newMsg];
                        } else {
                            // Update the last message (append token)
                            const lastIdx = draft.length - 1;
                            if (draft[lastIdx] && draft[lastIdx].role === 'assistant') {
                                draft[lastIdx] = {
                                    ...draft[lastIdx],
                                    content: draft[lastIdx].content + data.content
                                };
                                currentAssistantMessageRef.current = draft[lastIdx];
                                return draft;
                            }
                        }
                        return prev;
                    });
                } else if (data.type === 'sources') {
                    // Chegou as fontes RAG no final da Stream
                    setMessages((prev) => {
                        const draft = [...prev];
                        const lastIdx = draft.length - 1;
                        if (draft[lastIdx] && draft[lastIdx].role === 'assistant') {
                            draft[lastIdx] = {
                                ...draft[lastIdx],
                                sources: data.content
                            };
                            return draft;
                        }
                        return prev;
                    });
                } else if (data.type === 'done') {
                    // Finalizou geração
                    currentAssistantMessageRef.current = null;
                }

            } catch (err) {
                console.error("Erro no parse do WS Message:", err);
            }
        };

        ws.onclose = () => {
            console.log("[WS] Desconectado");
            setIsConnected(false);
            setIsTyping(false);
        };

        wsRef.current = ws;

    }, [activeConvId]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    // Effect para ligar quando a conversa mudar, desligar quando desmudar.
    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    // Expose function to inject Historical DB messages into the WS visual queue
    const loadHistory = useCallback((history: ChatMessage[]) => {
        setMessages(history);
    }, []);

    // Expose send function
    const sendMessage = useCallback((text: string) => {
        if (!text.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        // 1. Plota a mensagem do Usuário imediatamente
        const userMsg: ChatMessage = {
            id: `u${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);

        // 2. Dispara pra API FastAPI
        wsRef.current.send(JSON.stringify({ message: text }));
    }, []);

    return {
        messages,
        isConnected,
        isTyping,
        statusText,
        sendMessage,
        loadHistory
    };
}
