'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { UserPlus, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Customer } from '@/types/customer';
import {
  customerQuickCreateSchema,
  CustomerQuickCreateValues,
} from '@/lib/validations/customer';
import {
  createCustomerAction,
  checkDuplicatesAction,
} from '@/lib/actions/customers';
import { formatCpf, formatPhone, cleanNumeric } from '@/lib/utils/customer-normalizers';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CustomerQuickCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated: (customer: Customer) => void;
}

export function CustomerQuickCreateDialog({
  open,
  onOpenChange,
  onCustomerCreated,
}: CustomerQuickCreateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [dupWarning, setDupWarning] = useState<string | null>(null);

  const form = useForm<CustomerQuickCreateValues>({
    resolver: zodResolver(customerQuickCreateSchema) as any,
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      cpf: '',
      source: 'sale_registration',
    },
  });

  const handleBlurCheck = async () => {
    const cpf = form.getValues('cpf');
    const phone = form.getValues('phone');

    if ((cpf && cleanNumeric(cpf).length === 11) || (phone && cleanNumeric(phone).length >= 8)) {
      const res = await checkDuplicatesAction({ cpf, phone });
      if (res.hasExactCpfMatch) {
        setDupWarning(`CPF já cadastrado para ${res.cpfMatch?.full_name}.`);
      } else if (res.hasPhoneMatch) {
        setDupWarning(`Telefone coincide com ${res.phoneMatches[0]?.full_name}.`);
      } else {
        setDupWarning(null);
      }
    }
  };

  async function onSubmit(data: CustomerQuickCreateValues) {
    setLoading(true);
    try {
      const res = await createCustomerAction({
        full_name: data.full_name,
        phone: data.phone,
        email: data.email || null,
        cpf: data.cpf || null,
        source: 'sale_registration',
        is_active: true,
      } as any);

      if (res?.error) {
        toast.error(res.error);
      } else if (res?.success && res.id) {
        toast.success('Cliente cadastrado com sucesso!');
        onCustomerCreated({
          id: res.id,
          full_name: data.full_name,
          phone: data.phone,
          phone_normalized: cleanNumeric(data.phone),
          whatsapp: data.phone,
          whatsapp_normalized: cleanNumeric(data.phone),
          email: data.email || null,
          email_normalized: data.email ? data.email.toLowerCase().trim() : null,
          cpf: data.cpf || null,
          cpf_normalized: data.cpf ? cleanNumeric(data.cpf) : null,
          rg: null,
          gender: null,
          birth_date: null,
          cep: null,
          street: null,
          number: null,
          complement: null,
          neighborhood: null,
          city: null,
          state: null,
          source: 'sale_registration',
          source_detail: null,
          notes: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null,
          updated_by: null,
        });
        onOpenChange(false);
        form.reset();
      }
    } catch (err) {
      toast.error('Erro ao cadastrar cliente rápido.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0c0c0e] border-zinc-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#c9a44c]" />
            Cadastrar Novo Cliente
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Cadastre os dados mínimos do comprador para vincular a esta venda.
          </DialogDescription>
        </DialogHeader>

        {dupWarning && (
          <div className="flex items-center gap-2 p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{dupWarning}</span>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5 py-1">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-zinc-300">
                    Nome Completo <span className="text-rose-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Carlos Eduardo Lima"
                      className="bg-zinc-900 border-zinc-800 text-xs text-white focus:border-[#c9a44c] h-9"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-zinc-300">
                    Telefone / WhatsApp <span className="text-rose-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(81) 99999-9999"
                      className="bg-zinc-900 border-zinc-800 text-xs text-white focus:border-[#c9a44c] h-9"
                      {...field}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      onBlur={handleBlurCheck}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-zinc-300">CPF (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00"
                        className="bg-zinc-900 border-zinc-800 text-xs text-white focus:border-[#c9a44c] h-9 font-mono"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(formatCpf(e.target.value))}
                        onBlur={handleBlurCheck}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-rose-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-zinc-300">E-mail (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="cliente@email.com"
                        className="bg-zinc-900 border-zinc-800 text-xs text-white focus:border-[#c9a44c] h-9"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-rose-400" />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-zinc-800 text-xs text-zinc-300 h-9"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#c9a44c] hover:bg-[#b5923f] text-zinc-950 font-bold text-xs h-9 gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Salvar e Selecionar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
