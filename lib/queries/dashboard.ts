import { createClient } from '@/lib/supabase/server';

export async function getDashboardMetrics() {
  const supabase = await createClient();

  const [
    { count: availableCount },
    { count: soldCount },
    { count: leadCount },
  ] = await Promise.all([
    supabase
      .from('motorcycles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'AVAILABLE'),
    supabase
      .from('motorcycles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'SOLD'),
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'NEW'),
  ]);

  // Optionally fetch rented or other metrics if you have rentals
  const { count: rentedCount } = await supabase
    .from('motorcycles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'RENTED');

  return {
    available: availableCount || 0,
    sold: soldCount || 0,
    rented: rentedCount || 0,
    newLeads: leadCount || 0,
  };
}
