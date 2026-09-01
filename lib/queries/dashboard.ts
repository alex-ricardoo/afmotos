import { createClient } from '@/lib/supabase/server';
import { SaleWithDetails } from './sales';

export interface MonthlySalesData {
  monthKey: string; // YYYY-MM
  label: string; // "Ago/26"
  fullLabel: string; // "Agosto de 2026"
  revenue: number;
  count: number;
}

export interface PaymentMethodShare {
  method: string;
  label: string;
  count: number;
  revenue: number;
  percentage: number;
  color: string;
}

export interface BrandShare {
  brand: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface DashboardRecentLead {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  type: string;
  status: string;
  message?: string | null;
  created_at: string;
  source?: string | null;
  motorcycle?: {
    id: string;
    brand: string;
    model: string;
    price: number | null;
  } | null;
}

export interface DashboardRecentConsultation {
  id: string;
  plate_display: string;
  plate_normalized?: string;
  brand: string;
  model: string;
  year_model?: number | null;
  risk_level: string;
  status: string;
  consulted_at: string;
  charged_amount?: number | null;
}

export interface DashboardMetrics {
  // Financial & Stock KPIs
  totalRevenue: number;
  monthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowthPct: number;
  avgTicket: number;
  totalSalesCount: number;
  monthSalesCount: number;
  monthExpenses: number;
  netOperationalResult: number;

  availableStockCount: number;
  availableStockValue: number;
  totalMotorcyclesCount: number;

  newLeadsCount: number;
  totalLeadsCount: number;
  conversionRatePct: number;
  todayLeadsCount: number;
  todaySalesCount: number;

  bestMonth: {
    label: string;
    revenue: number;
    count: number;
  } | null;

  // Chart & List Data
  monthlyHistory: MonthlySalesData[];
  paymentDistribution: PaymentMethodShare[];
  topBrands: BrandShare[];
  recentSales: SaleWithDetails[];
  recentLeads: DashboardRecentLead[];
  recentConsultations: DashboardRecentConsultation[];
  pendingLeadsCount: number;
}

const MONTH_NAMES_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

const MONTH_NAMES_FULL = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const PAYMENT_LABELS: Record<string, { label: string; color: string }> = {
  PIX: { label: 'PIX', color: '#10b981' }, // Emerald
  FINANCIAMENTO: { label: 'Financiamento', color: '#f59e0b' }, // Amber
  CARTAO: { label: 'Cartão Crédito/Débito', color: '#6366f1' }, // Indigo
  TRANSFERENCIA: { label: 'Transferência / TED', color: '#0ea5e9' }, // Sky
  DINHEIRO: { label: 'Dinheiro (Espécie)', color: '#84cc16' }, // Lime
  OUTRO: { label: 'Outro', color: '#a1a1aa' }, // Zinc
};

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;
  const currentMonthKey = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;
  const todayDateKey = now.toISOString().split('T')[0];

  // Previous month key
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  // 1. Fetch All Sales with Motorcycle details
  const { data: salesData, error: salesError } = await supabase
    .from('sales')
    .select(
      `
      *,
      motorcycle:motorcycles(
        id,
        brand,
        model,
        version,
        year_manufacture,
        year_model,
        price,
        fipe_price,
        status,
        license_plate,
        color,
        images:motorcycle_images(
          id,
          public_url,
          display_url,
          is_primary,
          storage_path
        )
      )
    `,
    )
    .order('sale_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (salesError) {
    console.error('Error fetching sales for dashboard:', salesError);
  }

  // 2. Fetch Motorcycles Stock
  const { data: motorcyclesData } = await supabase
    .from('motorcycles')
    .select('id, price, status, brand, model');

  // 3. Fetch Leads
  const { data: leadsData } = await supabase
    .from('leads')
    .select('id, name, phone, email, type, status, message, metadata, source, created_at, motorcycle:motorcycles(id, brand, model, price)')
    .order('created_at', { ascending: false });

  // 4. Fetch Expenses for current month
  let monthExpenses = 0;
  try {
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('amount, expense_date, status')
      .eq('status', 'PAID');

    if (expensesData) {
      for (const exp of expensesData) {
        if (exp.expense_date && exp.expense_date.startsWith(currentMonthKey)) {
          monthExpenses += Number(exp.amount) || 0;
        }
      }
    }
  } catch (expErr) {
    console.warn('Dashboard: expenses query skipped or failed:', expErr);
  }

  // 5. Fetch Recent Vehicle Plate Consultations
  let recentConsultations: DashboardRecentConsultation[] = [];
  try {
    const { data: consultationsData } = await supabase
      .from('vehicle_plate_consultations')
      .select('id, plate_display, plate_normalized, brand, model, year_model, risk_level, status, consulted_at, charged_amount')
      .order('consulted_at', { ascending: false })
      .limit(5);

    if (consultationsData) {
      recentConsultations = consultationsData as DashboardRecentConsultation[];
    }
  } catch (consErr) {
    console.warn('Dashboard: consultations query skipped or failed:', consErr);
  }

  const allSales = (salesData as unknown as SaleWithDetails[]) || [];
  const allMotos = motorcyclesData || [];
  const allLeads = leadsData || [];

  // Resolve Images for Recent Sales
  const recentSales = allSales.slice(0, 5).map((sale) => {
    if (sale.motorcycle && sale.motorcycle.images) {
      const formattedImages = sale.motorcycle.images.map((img) => {
        let url = img.display_url || img.public_url || img.storage_path;
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
          const { data: publicUrlData } = supabase.storage
            .from('motorcycle-images')
            .getPublicUrl(img.storage_path || url);
          url = publicUrlData.publicUrl;
        }
        return { ...img, public_url: url, display_url: url };
      });
      return {
        ...sale,
        motorcycle: { ...sale.motorcycle, images: formattedImages },
      };
    }
    return sale;
  });

  // Calculate Revenue & Today Metrics
  let totalRevenue = 0;
  let monthRevenue = 0;
  let lastMonthRevenue = 0;
  let monthSalesCount = 0;
  let todaySalesCount = 0;
  const totalSalesCount = allSales.length;

  for (const sale of allSales) {
    const price = Number(sale.sale_price) || 0;
    totalRevenue += price;

    if (sale.sale_date) {
      if (sale.sale_date.startsWith(currentMonthKey)) {
        monthRevenue += price;
        monthSalesCount += 1;
      } else if (sale.sale_date.startsWith(prevMonthKey)) {
        lastMonthRevenue += price;
      }

      if (sale.sale_date.startsWith(todayDateKey)) {
        todaySalesCount += 1;
      }
    }
  }

  const avgTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;
  let revenueGrowthPct = 0;
  if (lastMonthRevenue > 0) {
    revenueGrowthPct = Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
  } else if (monthRevenue > 0) {
    revenueGrowthPct = 100;
  }

  const netOperationalResult = monthRevenue - monthExpenses;

  // Calculate Stock Metrics
  let availableStockCount = 0;
  let availableStockValue = 0;
  for (const moto of allMotos) {
    if (moto.status === 'AVAILABLE') {
      availableStockCount += 1;
      availableStockValue += Number(moto.price) || 0;
    }
  }

  // Calculate Leads & Conversion & Today Leads
  let todayLeadsCount = 0;
  const newLeadsCount = allLeads.filter((l) => {
    if (l.created_at && l.created_at.startsWith(todayDateKey)) {
      todayLeadsCount += 1;
    }
    return l.status === 'NEW';
  }).length;

  const totalLeadsCount = allLeads.length;
  const conversionRatePct =
    totalLeadsCount > 0 ? Math.min(100, Math.round((totalSalesCount / totalLeadsCount) * 100)) : 0;

  // Slice recent leads for dashboard widget
  const recentLeads: DashboardRecentLead[] = (allLeads.slice(0, 5) as unknown as DashboardRecentLead[]);

  // 4. Monthly History (Last 6 Months)
  const monthlyHistory: MonthlySalesData[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const monthKey = `${y}-${m}`;
    const label = `${MONTH_NAMES_SHORT[d.getMonth()]}/${String(y).slice(2)}`;
    const fullLabel = `${MONTH_NAMES_FULL[d.getMonth()]} de ${y}`;

    let rev = 0;
    let cnt = 0;

    for (const sale of allSales) {
      if (sale.sale_date && sale.sale_date.startsWith(monthKey)) {
        rev += Number(sale.sale_price) || 0;
        cnt += 1;
      }
    }

    monthlyHistory.push({
      monthKey,
      label,
      fullLabel,
      revenue: rev,
      count: cnt,
    });
  }

  // Find Best Month
  let bestMonth: DashboardMetrics['bestMonth'] = null;
  for (const m of monthlyHistory) {
    if (m.revenue > 0 && (!bestMonth || m.revenue > bestMonth.revenue)) {
      bestMonth = {
        label: m.fullLabel,
        revenue: m.revenue,
        count: m.count,
      };
    }
  }

  // 5. Payment Methods Distribution
  const paymentMap = new Map<string, { count: number; revenue: number }>();
  for (const sale of allSales) {
    const method = sale.payment_method || 'OUTRO';
    const current = paymentMap.get(method) || { count: 0, revenue: 0 };
    current.count += 1;
    current.revenue += Number(sale.sale_price) || 0;
    paymentMap.set(method, current);
  }

  const paymentDistribution: PaymentMethodShare[] = [];
  paymentMap.forEach((val, key) => {
    const config = PAYMENT_LABELS[key] || PAYMENT_LABELS['OUTRO'];
    paymentDistribution.push({
      method: key,
      label: config.label,
      count: val.count,
      revenue: val.revenue,
      percentage: totalRevenue > 0 ? Math.round((val.revenue / totalRevenue) * 100) : 0,
      color: config.color,
    });
  });
  paymentDistribution.sort((a, b) => b.revenue - a.revenue);

  // 6. Top Selling Brands
  const brandMap = new Map<string, { count: number; revenue: number }>();
  for (const sale of allSales) {
    const brand = sale.motorcycle?.brand?.toUpperCase().trim() || 'OUTRAS';
    const current = brandMap.get(brand) || { count: 0, revenue: 0 };
    current.count += 1;
    current.revenue += Number(sale.sale_price) || 0;
    brandMap.set(brand, current);
  }

  const topBrands: BrandShare[] = [];
  brandMap.forEach((val, key) => {
    topBrands.push({
      brand: key,
      count: val.count,
      revenue: val.revenue,
      percentage: totalSalesCount > 0 ? Math.round((val.count / totalSalesCount) * 100) : 0,
    });
  });
  topBrands.sort((a, b) => b.count - a.count);

  return {
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    revenueGrowthPct,
    avgTicket,
    totalSalesCount,
    monthSalesCount,
    monthExpenses,
    netOperationalResult,
    availableStockCount,
    availableStockValue,
    totalMotorcyclesCount: allMotos.length,
    newLeadsCount,
    totalLeadsCount,
    conversionRatePct,
    todayLeadsCount,
    todaySalesCount,
    bestMonth,
    monthlyHistory,
    paymentDistribution,
    topBrands,
    recentSales,
    recentLeads,
    recentConsultations,
    pendingLeadsCount: newLeadsCount,
  };
}
