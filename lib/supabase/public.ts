import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.ts';

let cachedPublicClient: SupabaseClient<Database> | null = null;

/**
 * Retorna um cliente Supabase estritamente anônimo e sem sessão para o catálogo público.
 *
 * Propriedades essenciais:
 * 1. Não lê nem encaminha cookies de requisição.
 * 2. Não possui dependência de auth.uid() ou contexto de administrador.
 * 3. Utiliza a role 'anon' via NEXT_PUBLIC_SUPABASE_ANON_KEY de forma padronizada.
 * 4. Garante que visitantes anônimos, usuários autenticados e administradores
 *    recebam exatamente a mesma resposta das rotas públicas.
 */
export function getPublicSupabaseClient(): SupabaseClient<Database> {
  if (cachedPublicClient) {
    return cachedPublicClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      'Configurações públicas do Supabase (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) não encontradas.',
    );
  }

  cachedPublicClient = createClient<Database>(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return cachedPublicClient;
}
