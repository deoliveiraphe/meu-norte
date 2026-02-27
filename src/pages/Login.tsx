import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Lock, Mail, AlertCircle, Compass, Bot, TrendingUp, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Por favor, preencha todos os campos.');
            return;
        }

        try {
            setIsLoading(true);
            setError('');

            const formData = new URLSearchParams();
            formData.append('username', email.trim().toLowerCase());
            formData.append('password', password);

            const response = await fetch(`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api/v1`}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Email ou senha inválidos.');
            }

            const data = await response.json();
            const token = data.access_token;

            const userData = await api.get('/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            login(token, userData);
            navigate('/');

        } catch (err: any) {
            setError(err.message || 'Erro ao realizar login. Tente novamente mais tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-background">

            {/* Lado Esquerdo: Formulário */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 xl:px-40 relative">

                {/* Logo Superior Discreto */}
                <div className="absolute top-8 left-8 sm:left-12 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Compass className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-bold text-foreground text-lg tracking-tight">Meu Norte</span>
                </div>

                <div className="max-w-md w-full mx-auto animate-fade-in-up">
                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
                            Bem-vindo de volta
                        </h1>
                        <p className="text-muted-foreground text-base">
                            Entre para continuar gerenciando suas finanças com inteligência artificial.
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-6 animate-shake bg-destructive/10 border-destructive/20 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="font-medium">{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2 focus-within-group relative">
                            <label className="text-sm font-semibold text-foreground/90 ml-1">Endereço de Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    type="email"
                                    placeholder="nome@exemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 pl-10 bg-secondary/30 border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all rounded-xl"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 focus-within-group relative">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-semibold text-foreground/90">Senha</label>
                                <a href="#" className="text-xs font-medium text-primary hover:underline hover:text-primary-focus transition-colors">Esqueceu a senha?</a>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-12 pl-10 pr-10 bg-secondary/30 border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all rounded-xl font-medium tracking-wide"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-sm font-bold rounded-xl mt-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Autenticando...</span>
                                </div>
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4 mr-2" /> Entrar na Plataforma
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-sm text-muted-foreground">
                            Não possui uma conta?{' '}
                            <Link to="/register" className="font-semibold text-foreground hover:text-primary transition-colors hover:underline">
                                Crie no Meu Norte Grátis
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Lado Direito: Banner Hero Moderno */}
            <div className="hidden lg:flex w-1/2 bg-sidebar-primary relative overflow-hidden items-center justify-center">
                {/* Elementos Decorativos de Fundo */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary rounded-full blur-[120px] opacity-40"></div>
                <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-500 rounded-full blur-[100px] opacity-20"></div>

                <div className="relative z-10 p-12 max-w-lg">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sidebar-accent/50 text-sidebar-accent-foreground border border-sidebar-border mb-8 backdrop-blur-sm">
                        <Bot className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider">Assistente LLaVA Integrado</span>
                    </div>

                    <h2 className="text-4xl lg:text-5xl font-extrabold text-sidebar-primary-foreground leading-tight mb-6">
                        Sua bússola na direção da <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">independência</span>.
                    </h2>

                    <p className="text-lg text-white/90 mb-10 leading-relaxed font-medium drop-shadow-sm">
                        Deixe a inteligência artificial analisar seus gastos, prever tendências e organizar seu patrimônio em um piscar de olhos.
                    </p>

                    {/* Features Grid Minimalista */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/50 backdrop-blur-md">
                            <TrendingUp className="w-6 h-6 text-primary mb-3" />
                            <h4 className="text-sm font-bold text-sidebar-primary-foreground mb-1">Evolução Clara</h4>
                            <p className="text-xs text-sidebar-foreground/70">Acompanhe seu progresso mês a mês.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/50 backdrop-blur-md">
                            <ShieldCheck className="w-6 h-6 text-primary mb-3" />
                            <h4 className="text-sm font-bold text-sidebar-primary-foreground mb-1">Dados Privados</h4>
                            <p className="text-xs text-sidebar-foreground/70">Arquitetura totalmente isolada.</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
