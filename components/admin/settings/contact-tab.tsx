'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Phone, Mail, MessageSquare, Info } from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface ContactTabProps {
  form: UseFormReturn<any>;
}

export function ContactTab({ form }: ContactTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
          <Phone className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Canais de Contato & Atendimento</h3>
          <p className="text-xs text-zinc-400">
            Defina o número oficial de WhatsApp comercial, telefone fixo e e-mail de contato.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormField
          control={form.control}
          name="whatsapp_phone"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Comercial Oficial <span className="text-rose-500">*</span></span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="(11) 99999-9999"
                  {...fieldProps}
                  value={value || ''}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                    if (digits.length <= 10) {
                      onChange(digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3'));
                    } else {
                      onChange(digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3'));
                    }
                  }}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl font-mono focus:border-amber-500 text-sm"
                />
              </FormControl>
              <FormDescription className="text-[11px] text-zinc-500">
                Alimenta os botões de conversa direta em todo o catálogo, cards e footer.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>E-mail Oficial da Loja <span className="text-rose-500">*</span></span>
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="contato@afmotos.com.br"
                  {...field}
                  value={field.value || ''}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:border-amber-500 text-sm"
                />
              </FormControl>
              <FormDescription className="text-[11px] text-zinc-500">
                Exibido no rodapé para envio de propostas e atendimento institucional.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="bg-zinc-950/40 border border-zinc-800/60 p-4 rounded-xl flex items-start gap-3 text-xs text-zinc-400">
        <Info className="w-4 h-4 text-[#c9a44c] shrink-0 mt-0.5" />
        <p>
          O número de WhatsApp cadastrado aqui é automaticamente normalizado no padrão internacional (wa.me) para garantir que links e CTAs funcionem perfeitamente em dispositivos móveis e navegadores desktop.
        </p>
      </div>
    </div>
  );
}
