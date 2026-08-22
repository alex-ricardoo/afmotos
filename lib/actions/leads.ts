'use server';

import { createClient } from '@/lib/supabase/server';

export async function createLeadAction(data: {
  type: 'MOTORCYCLE_INTEREST' | 'SELL_MOTORCYCLE' | 'CONSIGNMENT' | 'RENTAL' | 'MOTORCYCLE_REQUEST' | 'GENERAL_CONTACT';
  name: string;
  phone: string;
  email?: string;
  message?: string;
  metadata?: any;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from('leads').insert(data);

  if (error) {
    console.error('Error creating lead:', error);
    return { error: error.message };
  }

  return { success: true };
}

export async function getLeads() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error);
    return [];
  }

  return data;
}

export async function updateLeadStatus(id: string, status: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating lead status:', error);
    return { error: error.message };
  }

  return { success: true };
}
