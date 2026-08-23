import { createClient } from '@/lib/supabase/server';
import { Sale } from '@/types/database';

export interface SaleWithDetails extends Sale {
  motorcycle: {
    id: string;
    brand: string;
    model: string;
    version: string | null;
    year_manufacture: number;
    year_model: number;
    price: number | null;
    fipe_price: number | null;
    status: string;
    license_plate: string | null;
    color: string | null;
    images?: Array<{
      id?: string;
      public_url?: string | null;
      display_url?: string | null;
      is_primary?: boolean;
      storage_path?: string | null;
    }>;
  } | null;
}

export interface SalesMetrics {
  totalSalesCount: number;
  totalSalesValue: number;
  monthSalesCount: number;
  monthSalesValue: number;
}

export interface SalesFilterParams {
  search?: string;
  month?: string; // YYYY-MM
  paymentMethod?: string;
}

function resolveMotorcycleImages(supabase: any, images: any[]) {
  if (!images || !Array.isArray(images)) return [];
  return images.map((img) => {
    let url = img.display_url || img.public_url || img.storage_path;
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      const { data: publicUrlData } = supabase.storage
        .from('motorcycle-images')
        .getPublicUrl(img.storage_path || url);
      url = publicUrlData.publicUrl;
    }
    return {
      ...img,
      public_url: url,
      display_url: url,
    };
  });
}

export async function getNextSequentialReceiptNumber(): Promise<string> {
  const supabase = await createClient();
  const currentYear = new Date().getFullYear();
  const prefix = `AFM-${currentYear}-`;

  const { data, error } = await supabase
    .from('sales')
    .select('receipt_number')
    .ilike('receipt_number', `${prefix}%`);

  if (error || !data || data.length === 0) {
    return `${prefix}0001`;
  }

  let maxSeq = 0;
  for (const item of data) {
    if (item.receipt_number) {
      const parts = item.receipt_number.split('-');
      if (parts.length >= 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  const nextSeq = maxSeq + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

export async function getSales(params?: SalesFilterParams): Promise<SaleWithDetails[]> {
  const supabase = await createClient();

  let query = supabase
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

  if (params?.paymentMethod && params.paymentMethod !== 'ALL') {
    query = query.eq('payment_method', params.paymentMethod);
  }

  if (params?.month && params.month !== 'ALL') {
    const [year, month] = params.month.split('-');
    if (year && month) {
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      query = query.gte('sale_date', startDate).lte('sale_date', endDate);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching sales:', error);
    return [];
  }

  const rawSales = (data as unknown as SaleWithDetails[]) || [];

  // Format images with correct public URLs
  let result = rawSales.map((sale) => {
    if (sale.motorcycle && sale.motorcycle.images) {
      return {
        ...sale,
        motorcycle: {
          ...sale.motorcycle,
          images: resolveMotorcycleImages(supabase, sale.motorcycle.images),
        },
      };
    }
    return sale;
  });

  if (params?.search) {
    const searchLower = params.search.toLowerCase().trim();
    result = result.filter((item) => {
      const buyerMatch =
        item.buyer_name?.toLowerCase().includes(searchLower) ||
        item.buyer_phone?.toLowerCase().includes(searchLower) ||
        item.buyer_document?.toLowerCase().includes(searchLower) ||
        item.receipt_number?.toLowerCase().includes(searchLower);

      const motoMatch =
        item.motorcycle?.brand?.toLowerCase().includes(searchLower) ||
        item.motorcycle?.model?.toLowerCase().includes(searchLower) ||
        item.motorcycle?.license_plate?.toLowerCase().includes(searchLower);

      return buyerMatch || motoMatch;
    });
  }

  return result;
}

export async function getSaleById(id: string): Promise<SaleWithDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
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
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching sale by id:', error);
    return null;
  }

  const sale = data as unknown as SaleWithDetails;
  if (sale.motorcycle && sale.motorcycle.images) {
    sale.motorcycle.images = resolveMotorcycleImages(supabase, sale.motorcycle.images);
  }

  return sale;
}

export async function getSalesMetrics(): Promise<SalesMetrics> {
  const supabase = await createClient();

  const { data, error } = await supabase.from('sales').select('sale_price, sale_date');

  if (error || !data) {
    console.error('Error fetching sales metrics:', error);
    return {
      totalSalesCount: 0,
      totalSalesValue: 0,
      monthSalesCount: 0,
      monthSalesValue: 0,
    };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonthPrefix = `${currentYear}-${currentMonth}`;

  let totalSalesCount = 0;
  let totalSalesValue = 0;
  let monthSalesCount = 0;
  let monthSalesValue = 0;

  for (const sale of data) {
    const price = Number(sale.sale_price) || 0;
    totalSalesCount += 1;
    totalSalesValue += price;

    if (sale.sale_date && sale.sale_date.startsWith(currentMonthPrefix)) {
      monthSalesCount += 1;
      monthSalesValue += price;
    }
  }

  return {
    totalSalesCount,
    totalSalesValue,
    monthSalesCount,
    monthSalesValue,
  };
}

export async function getAvailableMotorcyclesForSale() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('motorcycles')
    .select(
      `
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
    `,
    )
    .in('status', ['AVAILABLE', 'RESERVED'])
    .order('brand', { ascending: true })
    .order('model', { ascending: true });

  if (error) {
    console.error('Error fetching available motorcycles for sale:', error);
    return [];
  }

  return (data || []).map((moto) => ({
    ...moto,
    images: resolveMotorcycleImages(supabase, moto.images || []),
  }));
}
