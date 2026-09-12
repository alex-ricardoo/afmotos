'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Mail,
  Lock,
  User,
  Phone,
  Calendar,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { registerCustomer, loginCustomer, loginWithGoogle } from '@/lib/customer/actions';

interface AuthFormProps {
  mode: 'login' | 'register';
  returnUrl?: string;
  onSuccess?: () => void;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  switch (score) {
    case 1:
      return { score: 1, label: 'Fraca', color: 'bg-red-500' };
    case 2:
      return { score: 2, label: 'Média', color: 'bg-amber-500' };
    case 3:
      return { score: 3, label: 'Boa', color: 'bg-blue-500' };
    case 4:
      return { score: 4, label: 'Forte', color: 'bg-emerald-500' };
    default:
      return { score: 0, label: 'Muito fraca', color: 'bg-red-600' };
  }
}

export function AuthForm({ mode, returnUrl: propReturnUrl, onSuccess }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = propReturnUrl || searchParams?.get('returnUrl') || '/cliente';

  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const passwordStrength = mode === 'register' ? getPasswordStrength(password) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      if (mode === 'login') {
        const res = await loginCustomer({ email, password });
        if (res.error) {
          setErrorMsg(res.error);
          toast.error(res.error);
        } else {
          toast.success('Login realizado com sucesso!');
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(returnUrl);
            router.refresh();
          }
        }
      } else {
        const res = await registerCustomer({
          full_name: fullName,
          email,
          phone,
          date_of_birth: dateOfBirth,
          password,
        });

        if (res.error) {
          setErrorMsg(res.error);
          toast.error(res.error);
        } else {
          toast.success('Cadastro criado com sucesso! Redirecionando...');
          // Automatically log the user in after registration
          const loginRes = await loginCustomer({ email, password });
          if (loginRes.error) {
            toast.error(loginRes.error);
            router.push(`/cliente/login?returnUrl=${encodeURIComponent(returnUrl)}`);
          } else {
            if (onSuccess) {
              onSuccess();
            } else {
              router.push(returnUrl);
              router.refresh();
            }
          }
        }
      }
    });
  };

  const handleGoogleAuth = () => {
    startTransition(async () => {
      const res = await loginWithGoogle(returnUrl);
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error(res.error || 'Não foi possível conectar com Google.');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Google OAuth Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleAuth}
        disabled={isPending}
        className="w-full h-11 bg-zinc-900/60 hover:bg-zinc-800/80 border-zinc-700/80 text-zinc-100 font-medium flex items-center justify-center gap-3 rounded-xl transition-all shadow-sm"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5c1.56 0 2.96.54 4.07 1.6l3.05-3.05C17.27 1.8 14.81 1 12 1 7.37 1 3.48 3.65 1.63 7.51l3.66 2.84C6.18 7.35 8.84 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.48-1.12 2.73-2.39 3.58l3.71 2.88c2.17-2 3.7-4.95 3.7-8.7z"
          />
          <path
            fill="#FBBC05"
            d="M5.29 14.65c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.63 7.51C.59 9.58 0 11.95 0 14.43s.59 4.85 1.63 6.92l3.66-2.84z"
          />
          <path
            fill="#34A853"
            d="M12 23.86c3.24 0 5.96-1.08 7.95-2.92l-3.71-2.88c-1.08.72-2.45 1.16-4.24 1.16-3.16 0-5.82-2.35-6.71-5.35L1.63 16.7C3.48 20.57 7.37 23.86 12 23.86z"
          />
        </svg>
        <span>{mode === 'login' ? 'Entrar com o Google' : 'Cadastrar com o Google'}</span>
      </Button>

      {/* Separator */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-zinc-800 w-full" />
        <span className="bg-[#0e0e11] px-3 text-[11px] uppercase tracking-wider text-zinc-400 font-semibold absolute">
          ou com e-mail
        </span>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <Label className="text-xs text-zinc-300 font-medium">Nome Completo</Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                type="text"
                required
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isPending}
                className="pl-9 bg-zinc-900/50 border-zinc-800 focus:border-[#c9a44c] focus:ring-[#c9a44c]/20 text-zinc-100 rounded-xl h-11 text-sm placeholder:text-zinc-400"
              />
            </div>
          </div>
        )}

        <div>
          <Label className="text-xs text-zinc-300 font-medium">E-mail</Label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              type="email"
              required
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              className="pl-9 bg-zinc-900/50 border-zinc-800 focus:border-[#c9a44c] focus:ring-[#c9a44c]/20 text-zinc-100 rounded-xl h-11 text-sm placeholder:text-zinc-400"
            />
          </div>
        </div>

        {mode === 'register' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-zinc-300 font-medium">WhatsApp / Telefone</Label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  disabled={isPending}
                  className="pl-9 bg-zinc-900/50 border-zinc-800 focus:border-[#c9a44c] focus:ring-[#c9a44c]/20 text-zinc-100 rounded-xl h-11 text-sm placeholder:text-zinc-400"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-zinc-300 font-medium">Data de Nascimento</Label>
              <div className="relative mt-1.5">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  disabled={isPending}
                  max={new Date().toISOString().split('T')[0]}
                  className="pl-9 bg-zinc-900/50 border-zinc-800 focus:border-[#c9a44c] focus:ring-[#c9a44c]/20 text-zinc-100 rounded-xl h-11 text-sm [color-scheme:dark]"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-zinc-300 font-medium">Senha</Label>
          </div>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : 'Sua senha'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              className="pl-9 pr-10 bg-zinc-900/50 border-zinc-800 focus:border-[#c9a44c] focus:ring-[#c9a44c]/20 text-zinc-100 rounded-xl h-11 text-sm placeholder:text-zinc-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password strength indicator */}
          {mode === 'register' && password && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-full flex-1 transition-all duration-300 ${
                      (passwordStrength?.score || 0) >= step
                        ? passwordStrength?.color
                        : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between items-center text-[10px] text-zinc-400">
                <span>Força da senha:</span>
                <span className="font-medium text-zinc-300">{passwordStrength?.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 bg-gradient-to-r from-[#c9a44c] to-[#b38e3a] hover:from-[#d8b35b] hover:to-[#c49e49] text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-[#c9a44c]/20 transition-all duration-200 mt-2"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{mode === 'login' ? 'Entrando...' : 'Criando conta...'}</span>
            </span>
          ) : (
            <span>{mode === 'login' ? 'Entrar na Conta' : 'Criar Minha Conta'}</span>
          )}
        </Button>
      </form>

      {/* Switch Mode Footer */}
      <div className="text-center text-xs text-zinc-400 pt-1">
        {mode === 'login' ? (
          <p>
            Não tem uma conta?{' '}
            <Link
              href={`/cliente/cadastro?returnUrl=${encodeURIComponent(returnUrl)}`}
              className="text-[#c9a44c] hover:underline font-semibold"
            >
              Cadastre-se grátis
            </Link>
          </p>
        ) : (
          <p>
            Já possui uma conta?{' '}
            <Link
              href={`/cliente/login?returnUrl=${encodeURIComponent(returnUrl)}`}
              className="text-[#c9a44c] hover:underline font-semibold"
            >
              Fazer login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
