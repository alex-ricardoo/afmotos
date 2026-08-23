'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(
          error.message === 'Invalid login credentials'
            ? 'E-mail ou senha incorretos. Verifique suas credenciais.'
            : error.message || 'Erro ao realizar login',
        );
        setLoading(false);
      } else {
        toast.success('Autenticado com sucesso! Redirecionando...');
        router.push('/admin');
        router.refresh();
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Ocorreu um erro inesperado ao autenticar.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto space-y-6">
      {/* Top action: Link to public site */}
      <div className="flex items-center justify-between px-1">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors py-1.5 px-3 rounded-lg hover:bg-zinc-900/60 border border-transparent hover:border-zinc-800/60"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao site público</span>
        </Link>

        <div className="flex items-center gap-1 text-[11px] text-[#c9a44c] font-semibold">
          <Sparkles className="w-3 h-3" />
          <span>Painel Seguro</span>
        </div>
      </div>

      {/* Main Glass Card */}
      <div className="relative rounded-3xl bg-zinc-950/70 border border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(201,164,76,0.06)] backdrop-blur-2xl p-7 sm:p-9 overflow-hidden">
        {/* Top Gold Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent opacity-80" />

        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-zinc-900">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#c9a44c]/40 to-amber-500/20 blur-md group-hover:blur-lg transition-all duration-300 opacity-75" />
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#c9a44c]/70 bg-black/60 shadow-[0_0_20px_rgba(201,164,76,0.25)] flex items-center justify-center">
              <Image src="/logo.png" alt="AF Motos Logo" fill priority className="object-cover" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                AF <span className="text-[#c9a44c]">Motos</span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/40">
                Admin
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-[260px] mx-auto leading-relaxed">
              Painel restrito de gestão de estoque, vendas e propostas.
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleLogin} className="space-y-4 pt-6">
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              <span>E-mail Corporativo</span>
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="seu.email@afmotos.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-zinc-900/80 border-zinc-800 focus-visible:border-[#c9a44c] focus-visible:ring-[#c9a44c]/30 text-white placeholder:text-zinc-500 h-11 rounded-xl text-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Senha de Acesso</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="bg-zinc-900/80 border-zinc-800 focus-visible:border-[#c9a44c] focus-visible:ring-[#c9a44c]/30 text-white placeholder:text-zinc-500 h-11 rounded-xl text-sm pr-10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer p-1"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] hover:opacity-95 text-zinc-950 font-bold h-11 rounded-xl shadow-[0_4px_20px_rgba(201,164,76,0.25)] active:scale-[0.98] transition-all text-sm mt-2 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                Autenticando...
              </span>
            ) : (
              'Acessar Painel'
            )}
          </Button>
        </form>

        {/* Security badge at bottom of card */}
        <div className="pt-6 mt-6 border-t border-zinc-900/80 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-[#c9a44c]" />
          <span>Acesso protegido com criptografia SSL</span>
        </div>
      </div>

      {/* Footer copyright */}
      <p className="text-center text-[11px] text-zinc-500">
        © {new Date().getFullYear()} AF Motos. Todos os direitos reservados.
      </p>
    </div>
  );
}
