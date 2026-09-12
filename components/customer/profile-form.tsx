'use client';

import React, { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Camera,
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
import {
  updateCustomerProfile,
  uploadCustomerAvatarAction,
} from '@/lib/customer/actions';

interface ProfileFormProps {
  profile: CustomerProfile;
}

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPending, startTransition] = useTransition();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Form State
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [phone, setPhone] = useState(formatPhone(profile.phone || ''));
  const [dateOfBirth, setDateOfBirth] = useState(profile.date_of_birth || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');

  // Address State
  const [street, setStreet] = useState(profile.address_street || '');
  const [number, setNumber] = useState(profile.address_number || '');
  const [complement, setComplement] = useState(profile.address_complement || '');
  const [neighborhood, setNeighborhood] = useState(profile.address_neighborhood || '');
  const [city, setCity] = useState(profile.address_city || '');
  const [state, setState] = useState(profile.address_state || '');
  const [zip, setZip] = useState(formatCep(profile.address_zip || ''));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadCustomerAvatarAction(formData);
      if (res.data?.url) {
        setAvatarUrl(res.data.url);
        toast.success('Foto atualizada! Lembre-se de salvar as alterações.');
      } else {
        toast.error(res.error || 'Erro ao fazer upload da foto.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Ocorreu um erro ao enviar a imagem.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const res = await updateCustomerProfile({
        full_name: fullName,
        phone,
        date_of_birth: dateOfBirth,
        avatar_url: avatarUrl,
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
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#c9a44c] to-[#997628] flex items-center justify-center text-zinc-950 font-black text-3xl overflow-hidden shadow-xl border-2 border-zinc-800 group-hover:border-[#c9a44c] transition-colors">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
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

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-[#c9a44c] hover:bg-zinc-800 shadow-lg cursor-pointer transition-transform active:scale-90"
              title="Alterar foto de perfil"
            >
              {isUploadingPhoto ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">{fullName || 'Meu Perfil'}</h2>
            <p className="text-xs text-zinc-400">{profile.email}</p>
            <p className="text-[11px] text-zinc-400">
              Clique no ícone da câmera para trocar sua foto de perfil
            </p>
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
