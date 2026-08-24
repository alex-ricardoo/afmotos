/**
 * AF Motos - Definições de Tipos para Configurações Institucionais e Marca
 */

export type ImageStorageProvider = 'local' | 'imgbb' | 'supabase';

export interface BrandingSettings {
  logoProvider?: ImageStorageProvider;
  logoUrl?: string | null;
  logoPath?: string | null;
  faviconProvider?: ImageStorageProvider;
  faviconUrl?: string | null;
  faviconPath?: string | null;
  primaryColor?: string;
  accentColor?: string;
}

export interface DetailedAddress {
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  mapsUrl?: string | null;
}

export interface SocialLinks {
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  whatsapp?: string | null;
}

export interface BusinessPeriod {
  opensAt: string;
  closesAt: string;
}

export interface BusinessDay {
  isOpen: boolean;
  periods: BusinessPeriod[];
}

export interface BusinessHours {
  monday?: BusinessDay;
  tuesday?: BusinessDay;
  wednesday?: BusinessDay;
  thursday?: BusinessDay;
  friday?: BusinessDay;
  saturday?: BusinessDay;
  sunday?: BusinessDay;
}

export interface PublicContentSettings {
  heroTitle?: string;
  heroSubtitle?: string;
  aboutText?: string;
  footerText?: string;
  whatsappMessage?: string;
  commercialNotice?: string;
}

export interface SeoSettings {
  title?: string;
  description?: string;
  ogImageUrl?: string | null;
  canonicalUrl?: string | null;
}

export interface SiteSettingsData {
  shortName?: string;
  slogan?: string;
  description?: string;
  branding?: BrandingSettings;
  address?: DetailedAddress;
  socialLinks?: SocialLinks;
  businessHours?: BusinessHours;
  publicContent?: PublicContentSettings;
  seo?: SeoSettings;
  // Retrocompatibilidade com chaves planas legadas
  short_name?: string;
  institutional_description?: string;
  logo_path?: string;
  favicon_path?: string;
  instagram_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
}

export interface SiteSettingsRecord {
  id: string;
  site_name: string;
  whatsapp_phone: string;
  contact_email: string | null;
  address: string | null;
  settings: SiteSettingsData | null;
  created_at: string;
  updated_at: string;
}

export interface SiteLogoResolved {
  src: string;
  provider: ImageStorageProvider;
  alt: string;
  isCustom: boolean;
}

export interface SocialLinkItem {
  key: keyof SocialLinks;
  label: string;
  href: string;
}

export interface FormattedBusinessHours {
  weekdays: string;
  saturday: string;
  sunday: string;
  raw: BusinessHours;
}
