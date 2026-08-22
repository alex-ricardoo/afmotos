'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message || 'Erro ao fazer login');
      setLoading(false);
    } else {
      toast.success('Login realizado com sucesso!');
      router.push('/admin');
      router.refresh();
    }
  };

  return (
    <Card className="w-full max-w-md bg-[#111111] border-[#333333] text-[#f4f4f2] shadow-2xl">
      <CardHeader className="space-y-3 text-center pb-6">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#333333] flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#c9a44c]" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">AF Motos Admin</CardTitle>
        <CardDescription className="text-gray-400">
          Entre com suas credenciais para acessar o painel restrito
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@afmotos.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#050505] border-[#333333] focus-visible:ring-[#c9a44c] text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#050505] border-[#333333] focus-visible:ring-[#c9a44c] text-white"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button
            type="submit"
            className="w-full bg-[#c9a44c] hover:bg-[#b8943c] text-black font-semibold"
            disabled={loading}
          >
            {loading ? 'Autenticando...' : 'Acessar Painel'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
