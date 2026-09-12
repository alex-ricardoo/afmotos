'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { CustomerProfile } from '@/lib/customer/types';
import { updateCustomerProfile } from '@/lib/customer/actions';

interface ProfileFormProps {
  profile: CustomerProfile;
}

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

function GoogleIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
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
  );
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  // Form State
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [phone, setPhone] = useState(formatPhone(profile.phone || ''));
  const [dateOfBirth, setDateOfBirth] = useState(profile.date_of_birth || '');

  // Address State
  const [street, setStreet] = useState(profile.address_street || '');
  const [number, setNumber] = useState(profile.address_number || '');
  const [complement, setComplement] = useState(profile.address_complement || '');
  const [neighborhood, setNeighborhood] = useState(profile.address_neighborhood || '');
  const [city, setCity] = useState(profile.address_city || '');
  const [state, setState] = useState(profile.address_state || '');
  const [zip, setZip] = useState(formatCep(profile.address_zip || ''));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const res = await updateCustomerProfile({
        full_name: fullName,
        phone,
        date_of_birth: dateOfBirth,
        avatar_url: profile.avatar_url || undefined,
        address_street: street,
        address_number: number,
        address_complement: complement,
        address_neighborhood: neighborhood,
        address_city: city,
        address_state: state,
        address_zip: zip,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Perfil atualizado com sucesso!');
        router.refresh();
      }
    });
  };

  const userInitial = fullName ? fullName.charAt(0).toUpperCase() : 'C';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Avatar & Personal Info Card */}
      <div className="rounded-3xl bg-zinc-950/70 border border-zinc-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent opacity-80" />

        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-zinc-800/80">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#c9a44c] to-[#997628] flex items-center justify-center text-zinc-950 font-black text-3xl overflow-hidden shadow-xl border-2 border-zinc-800">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={fullName}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                userInitial
              )}
            </div>
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">{fullName || 'Meu Perfil'}</h2>
            <p className="text-xs text-zinc-400">{profile.email}</p>
            {profile.avatar_url ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-300 mt-1">
                <GoogleIcon className="w-3 h-3" />
                <span>Foto sincronizada com a Conta Google</span>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-500 mt-1">
                Identificação por inicial do nome
              </p>
            )}
          </div>
        </div>

        {/* Personal Details Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label className="text-xs text-zinc-300 font-medium">Nome Completo</Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isPending}
                className="pl-9 bg-zinc-900/50 border-zinc-800 text-zinc-100 rounded-xl h-11 text-sm focus:border-[#c9a44c]"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-zinc-300 font-medium">E-mail (Cadastro)</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                type="email"
                disabled
                value={profile.email}
                className="pl-9 bg-zinc-900/30 border-zinc-800/60 text-zinc-400 rounded-xl h-11 text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-zinc-300 font-medium">Telefone / WhatsApp</Label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                disabled={isPending}
                className="pl-9 bg-zinc-900/50 border-zinc-800 text-zinc-100 rounded-xl h-11 text-sm focus:border-[#c9a44c]"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-zinc-300 font-medium">Data de Nascimento</Label>
            <div className="relative mt-1.5">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                disabled={isPending}
                max={new Date().toISOString().split('T')[0]}
                className="pl-9 bg-zinc-900/50 border-zinc-800 text-zinc-100 rounded-xl h-11 text-sm [color-scheme:dark] focus:border-[#c9a44c]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Address Information Card */}
      <div className="rounded-3xl bg-zinc-950/70 border border-zinc-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800/80">
          <MapPin className="w-5 h-5 text-[#c9a44c]" />
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Endereço de Contato</h3>
            <p className="text-xs text-zinc-400">Informações opcionais para agilizar propostas e contratos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <Label className="text-xs text-zinc-300 font-medium">CEP</Label>
            <Input
              type="text"
              value={zip}
              onChange={(e) => setZip(formatCep(e.target.value))}
              placeholder="00000-000"
              disabled={isPending}
              className="mt-1.5 bg-zinc-900/50 border-zinc-800 text-zinc-100 rounded-xl h-11 text-sm focus:border-[#c9a44c]"
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="text-xs text-zinc-300 font-medium">Logradouro / Rua</Label>
            <Input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Ex: Av. Paulista"
              disabled={isPending}
              className="mt-1.5 bg-zinc-900/50 border-zinc-800 text-zinc-100 rounded-xl h-11 text-sm focus:border-[#c9a44c]"
            />
          </div>

          <div>
            <Label className="text-xs text-zinc-300 font-medium">Número</Label>
            <Input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Ex: 1000"
              disabled={isPending}
              className="mt-1.5 bg-zinc-900/50 border-zinc-800 text-zinc-100 rounded-xl h-11 text-sm focus:border-[#c9a44c]"
            />
          </div>

          <div>
            <Label className="text-xs text-zinc-300 font-medium">Complemento</Label>
            <Input
              type="text"
              value={complement}
              onChange={(e) => setComplement(e.target.value)}
              placeholder="Apto 42, Bloco B"
              disabled={isPending}
              className="mt-1.5 bg-zinc-900/50 border-zinc-800 text-zinc-100 rounded-xl h-11 text-sm focus:border-[#c9a44c]"
            />
          </div>

          <div>
            <Label className="text-xs text-zinc-300 font-medium">Bairro</Label>
            <Input
              type="text"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Ex: Bela Vista"
              disabled={isPending}
              className="mt-1.5 bg-zinc-900/50 border-zinc-800 text-zinc-100 rounded-xl h-11 text-sm focus:border-[#c9a44c]"
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="text-xs text-zinc-300 font-medium">Cidade</Label>
            <Input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: São Paulo"
              disabled={isPending}
              className="mt-1.5 bg-zinc-900/50 border-zinc-800 text-zinc-100 rounded-xl h-11 text-sm focus:border-[#c9a44c]"
            />
          </div>

          <div>
            <Label className="text-xs text-zinc-300 font-medium">Estado (UF)</Label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              disabled={isPending}
              className="w-full mt-1.5 bg-zinc-900/50 border border-zinc-800 text-zinc-100 rounded-xl h-11 px-3 text-sm focus:border-[#c9a44c] focus:outline-none"
            >
              <option value="">Selecione</option>
              {BRAZILIAN_STATES.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="h-12 px-8 bg-gradient-to-r from-[#c9a44c] to-[#b38e3a] hover:from-[#d8b35b] hover:to-[#c49e49] text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-[#c9a44c]/20 transition-all duration-200 flex items-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Salvando alterações...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
