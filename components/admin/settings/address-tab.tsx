'use client';

import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { MapPin, Search, ExternalLink, Loader2, Compass } from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BRAZIL_STATES = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' },
];

interface AddressTabProps {
  form: UseFormReturn<any>;
}

export function AddressTab({ form }: AddressTabProps) {
  const [loadingCep, setLoadingCep] = useState(false);

  const cep = form.watch('settings.address.cep');
  const street = form.watch('settings.address.street');
  const number = form.watch('settings.address.number');
  const neighborhood = form.watch('settings.address.neighborhood');
  const city = form.watch('settings.address.city');
  const state = form.watch('settings.address.state');
  const customMapsUrl = form.watch('settings.address.mapsUrl');

  // Consulta automática via CEP
  const handleFetchCep = async () => {
    const cleanCep = (cep || '').replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      toast.error('Informe um CEP válido com 8 dígitos.');
      return;
    }

    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();

      if (data.erro) {
        toast.error('CEP não encontrado.');
      } else {
        if (data.logradouro) form.setValue('settings.address.street', data.logradouro, { shouldDirty: true });
        if (data.bairro) form.setValue('settings.address.neighborhood', data.bairro, { shouldDirty: true });
        if (data.localidade) form.setValue('settings.address.city', data.localidade, { shouldDirty: true });
        if (data.uf) form.setValue('settings.address.state', data.uf, { shouldDirty: true });

        // Atualiza a coluna de texto plano address para compatibilidade
        const fullAddress = `${data.logradouro || ''}, ${form.getValues('settings.address.number') || ''} - ${data.bairro || ''}, ${data.localidade || ''} - ${data.uf || ''}, ${cleanCep.replace(/^(\d{5})(\d{3})$/, '$1-$2')}`;
        form.setValue('address', fullAddress.replace(/^, /, '').trim(), { shouldDirty: true });

        toast.success('Endereço preenchido via CEP com sucesso!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Falha ao consultar serviço de CEP.');
    } finally {
      setLoadingCep(false);
    }
  };

  // Monta link calculado para preview do Maps
  const computedMapsQuery = [street, number, neighborhood, city, state, cep].filter(Boolean).join(', ');
  const computedMapsUrl = customMapsUrl && customMapsUrl.startsWith('https://')
    ? customMapsUrl
    : computedMapsQuery
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(computedMapsQuery)}`
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Localização & Endereço Completo</h3>
          <p className="text-xs text-zinc-400">
            Cadastre o endereço da loja física com integração direta para o Google Maps.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CEP com botão de busca */}
        <FormField
          control={form.control}
          name="settings.address.cep"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem className="md:col-span-1">
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">CEP</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="00000-000"
                    {...fieldProps}
                    value={value || ''}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                      onChange(digits.replace(/^(\d{5})(\d{0,3})/, '$1-$2'));
                    }}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl font-mono focus:border-amber-500 text-sm"
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleFetchCep}
                  disabled={loadingCep}
                  className="h-11 w-11 shrink-0 border-zinc-800 bg-zinc-900 text-amber-400 hover:bg-zinc-800 hover:text-amber-300 cursor-pointer"
                  title="Buscar endereço pelo CEP"
                >
                  {loadingCep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Logradouro / Rua */}
        <FormField
          control={form.control}
          name="settings.address.street"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">Logradouro / Avenida / Rua</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Av. Governador Agamenon Magalhães"
                  {...field}
                  value={field.value || ''}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:border-amber-500 text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Número */}
        <FormField
          control={form.control}
          name="settings.address.number"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">Número</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: 1200 ou S/N"
                  {...field}
                  value={field.value || ''}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:border-amber-500 text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Complemento */}
        <FormField
          control={form.control}
          name="settings.address.complement"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">Complemento</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Galpão A, Sala 2"
                  {...field}
                  value={field.value || ''}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:border-amber-500 text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bairro */}
        <FormField
          control={form.control}
          name="settings.address.neighborhood"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">Bairro</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Centro"
                  {...field}
                  value={field.value || ''}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:border-amber-500 text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cidade */}
        <FormField
          control={form.control}
          name="settings.address.city"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">Cidade</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Cabo de Santo Agostinho"
                  {...field}
                  value={field.value || ''}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:border-amber-500 text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Estado (UF) */}
        <FormField
          control={form.control}
          name="settings.address.state"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">Estado (UF)</FormLabel>
              <FormControl>
                <select
                  {...field}
                  value={field.value || ''}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 h-11 rounded-xl px-3 text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Selecione a UF</option>
                  {BRAZIL_STATES.map((st) => (
                    <option key={st.uf} value={st.uf}>
                      {st.uf} - {st.name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* URL Personalizada do Google Maps */}
        <FormField
          control={form.control}
          name="settings.address.mapsUrl"
          render={({ field }) => (
            <FormItem className="md:col-span-3">
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Link Personalizado do Google Maps (Opcional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="https://maps.google.com/?q=..."
                  {...field}
                  value={field.value || ''}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:border-amber-500 text-sm"
                />
              </FormControl>
              <FormDescription className="text-[11px] text-zinc-500">
                Se deixado em branco, o sistema gerará automaticamente o link oficial do Google Maps com base nos campos de endereço preenchidos.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Preview do Link do Google Maps */}
      {computedMapsUrl && (
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-amber-400">Preview do Link no Rodapé</span>
            <p className="text-xs text-zinc-300 line-clamp-1">{computedMapsQuery || computedMapsUrl}</p>
          </div>
          <a
            href={computedMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-amber-400 border border-amber-500/30 shrink-0"
          >
            <span>Testar no Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
