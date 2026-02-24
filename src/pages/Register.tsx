import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Lock, Mail, AlertCircle, User as UserIcon, Compass, Sparkles, PieChart, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from "@/components/ui/use-toast";

export default function Register() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome || !email || !password) {
            setError('Por favor, preencha todos os campos.');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        try {
            setIsLoading(true);
            setError('');

            const payload = {
                email: email.trim().toLowerCase(),
                password,
                nome: nome.trim(),
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Ocorreu um erro ao criar a conta.');
            }

            toast({
                title: "Conta Criada com Sucesso!",
                description: "Faça login com sua nova senha.",
                className: "bg-success text-white border-success-focus"
            });
            navigate('/login');

        } catch (err: any) {
            setError(err.message || 'Erro ao realizar cadastro.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-background">

            {/* Lado Esquerdo: Formulário Minimalista */}
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
                            Comece agora
                        </h1>
                        <p className="text-muted-foreground text-base">
                            Sua jornada para a independência financeira está a apenas um passo.
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-6 animate-shake bg-destructive/10 border-destructive/20 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="font-medium">{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-2 focus-within-group relative">
                            <label className="text-sm font-semibold text-foreground/90 ml-1">Nome Completo</label>
                            <div className="relative group">
                                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    type="text"
                                    placeholder="Ex: Joana Alves"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    className="h-12 pl-10 bg-secondary/30 border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all rounded-xl font-medium"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 focus-within-group relative">
                            <label className="text-sm font-semibold text-foreground/90 ml-1">Endereço de Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    type="email"
                                    placeholder="nome@exemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 pl-10 bg-secondary/30 border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all rounded-xl font-medium"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 focus-within-group relative">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-semibold text-foreground/90">Senha Segura</label>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Mínimo 6 caracteres"
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
                            className="w-full h-12 text-sm font-bold rounded-xl mt-4 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Criando ambiente...</span>
                                </div>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4 mr-2" /> Criar minha conta grátis
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center pt-6 border-t border-border/40">
                        <p className="text-sm text-muted-foreground">
                            Já possui o App?{' '}
                            <Link to="/login" className="font-semibold text-foreground hover:text-primary transition-colors hover:underline">
                                Fazer Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Lado Direito: Banner Hero Moderno Inverse */}
            <div className="hidden lg:flex w-1/2 bg-[#0B0F19] relative overflow-hidden items-center justify-center">
                {/* Elementos Decorativos de Fundo */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary rounded-full blur-[150px] opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600 rounded-full blur-[130px] opacity-20"></div>

                <div className="relative z-10 p-12 max-w-lg">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 text-white/80 border border-white/10 mb-8 backdrop-blur-sm">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold tracking-wider">Descomplique seus gastos</span>
                    </div>

                    <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
                        Planeje hoje o seu futuro de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">sucesso</span>.
                    </h2>

                    <p className="text-lg text-white/90 mb-10 leading-relaxed font-medium drop-shadow-sm">
                        Crie sua conta em menos de um minuto e experimente o poder do Meu Norte acompanhando suas movimentações.
                    </p>

                    {/* Features Grid Minimalista Inverso */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <PieChart className="w-6 h-6 text-primary mb-3" />
                            <h4 className="text-sm font-bold text-white mb-1">Múltiplas Categorias</h4>
                            <p className="text-xs text-white/60">Organize despesas nativamente.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <LockKeyhole className="w-6 h-6 text-primary mb-3" />
                            <h4 className="text-sm font-bold text-white mb-1">Backup Seguro</h4>
                            <p className="text-xs text-white/60">Protegido por criptografia.</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
