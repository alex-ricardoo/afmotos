import { CONSTANTS } from '@/lib/utils/constants';
import {
  SiteSettingsRecord,
  SiteSettingsData,
  SiteLogoResolved,
  SocialLinkItem,
  DetailedAddress,
  FormattedBusinessHours,
} from '@/types/site-settings';

/**
 * Retorna as configurações públicas processadas a partir de um registro de site_settings.
 * Função pura e segura para componentes Server e Client.
 */
export function resolvePublicSiteSettings(raw?: SiteSettingsRecord | null): {
  siteName: string;
  shortName: string;
  slogan: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  detailedAddress?: DetailedAddress;
  logo: SiteLogoResolved;
  socialLinks: SocialLinkItem[];
  businessHours: FormattedBusinessHours;
  mapsUrl: string | null;
  heroTitle?: string;
  heroSubtitle?: string;
  aboutText?: string;
  footerText?: string;
} {
  const siteName = raw?.site_name || CONSTANTS.STORE_NAME;
  const shortName = raw?.settings?.shortName || raw?.settings?.short_name || siteName;
  const slogan = raw?.settings?.slogan || CONSTANTS.STORE_SLOGAN;
  const description =
    raw?.settings?.description ||
    raw?.settings?.institutional_description ||
    raw?.settings?.publicContent?.aboutText ||
    CONSTANTS.STORE_DESCRIPTION;
  const phone = raw?.whatsapp_phone || CONSTANTS.CONTACT_PHONE;
  const email = raw?.contact_email || CONSTANTS.CONTACT_EMAIL;
  const address = raw?.address || CONSTANTS.STORE_ADDRESS;
  const detailedAddress = raw?.settings?.address;

  const logo = getSiteLogo(raw);
  const socialLinks = getSocialLinks(raw);
  const businessHours = getBusinessHours(raw);
  const mapsUrl = getMapsUrl(raw);

  return {
    siteName,
    shortName,
    slogan,
    description,
    phone,
    email,
    address,
    detailedAddress,
    logo,
    socialLinks,
    businessHours,
    mapsUrl,
    heroTitle: raw?.settings?.publicContent?.heroTitle,
    heroSubtitle: raw?.settings?.publicContent?.heroSubtitle,
    aboutText: raw?.settings?.publicContent?.aboutText,
    footerText: raw?.settings?.publicContent?.footerText,
  };
}

/**
 * Resolve a logo ativa da loja com cadeia de fallback estrita:
 * 1. Logo configurada em site_settings.settings.branding.logoUrl
 * 2. Logo em site_settings.settings.logo_path (legado)
 * 3. Logo local padrão '/logo.jpg'
 */
export function getSiteLogo(
  settings?: SiteSettingsRecord | SiteSettingsData | null,
): SiteLogoResolved {
  const siteName =
    (settings as SiteSettingsRecord)?.site_name ||
    (settings as SiteSettingsData)?.shortName ||
    CONSTANTS.STORE_NAME;

  const branding =
    (settings as SiteSettingsRecord)?.settings?.branding ||
    (settings as SiteSettingsData)?.branding;

  // 1. URL direta de branding
  if (
    branding?.logoUrl &&
    typeof branding.logoUrl === 'string' &&
    branding.logoUrl.trim().length > 0
  ) {
    return {
      src: branding.logoUrl.trim(),
      provider: branding.logoProvider || 'imgbb',
      alt: siteName,
      isCustom: true,
    };
  }

  // 2. Chave legada logo_path se for URL completa
  const legacyPath =
    (settings as SiteSettingsRecord)?.settings?.logo_path ||
    (settings as SiteSettingsData)?.logo_path;

  if (legacyPath && (legacyPath.startsWith('http://') || legacyPath.startsWith('https://'))) {
    return {
      src: legacyPath,
      provider: 'imgbb',
      alt: siteName,
      isCustom: true,
    };
  }

  // 3. Fallback para arquivo local padrão
  return {
    src: '/logo.jpg',
    provider: 'local',
    alt: siteName,
    isCustom: false,
  };
}

/**
 * Extrai e valida a lista de redes sociais cadastradas com HTTPS.
 */
export function getSocialLinks(
  settings?: SiteSettingsRecord | SiteSettingsData | null,
): SocialLinkItem[] {
  const rawSocial =
    (settings as SiteSettingsRecord)?.settings?.socialLinks ||
    (settings as SiteSettingsData)?.socialLinks;

  const legacySettings =
    (settings as SiteSettingsRecord)?.settings || (settings as SiteSettingsData);

  const instagram = rawSocial?.instagram || legacySettings?.instagram_url;
  const facebook = rawSocial?.facebook || legacySettings?.facebook_url;
  const tiktok = rawSocial?.tiktok || legacySettings?.tiktok_url;
  const youtube = rawSocial?.youtube || legacySettings?.youtube_url;

  const links: SocialLinkItem[] = [];

  const sanitizeUrl = (url?: string | null): string | null => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed.startsWith('https://')) return null;
    return trimmed;
  };

  const validInstagram = sanitizeUrl(instagram);
  if (validInstagram) {
    links.push({ key: 'instagram', label: 'Instagram', href: validInstagram });
  }

  const validFacebook = sanitizeUrl(facebook);
  if (validFacebook) {
    links.push({ key: 'facebook', label: 'Facebook', href: validFacebook });
  }

  const validTiktok = sanitizeUrl(tiktok);
  if (validTiktok) {
    links.push({ key: 'tiktok', label: 'TikTok', href: validTiktok });
  }

  const validYoutube = sanitizeUrl(youtube);
  if (validYoutube) {
    links.push({ key: 'youtube', label: 'YouTube', href: validYoutube });
  }

  return links;
}

/**
 * Traduz e formata os horários de funcionamento em português.
 */
export function getBusinessHours(
  settings?: SiteSettingsRecord | SiteSettingsData | null,
): FormattedBusinessHours {
  const hours =
    (settings as SiteSettingsRecord)?.settings?.businessHours ||
    (settings as SiteSettingsData)?.businessHours;

  const defaultResult: FormattedBusinessHours = {
    weekdays: 'Segunda a Sexta: 08h às 18h',
    saturday: 'Sábado: 08h às 13h',
    sunday: 'Domingo: Fechado',
    raw: hours || {},
  };

  if (!hours) {
    return defaultResult;
  }

  const formatDayPeriod = (day?: {
    isOpen: boolean;
    periods?: Array<{ opensAt: string; closesAt: string }>;
  }): string => {
    if (!day || !day.isOpen || !day.periods || day.periods.length === 0) {
      return 'Fechado';
    }
    return day.periods.map((p) => `${p.opensAt} às ${p.closesAt}`).join(' e ');
  };

  const mon = formatDayPeriod(hours.monday);
  const tue = formatDayPeriod(hours.tuesday);
  const wed = formatDayPeriod(hours.wednesday);
  const thu = formatDayPeriod(hours.thursday);
  const fri = formatDayPeriod(hours.friday);
  const sat = formatDayPeriod(hours.saturday);
  const sun = formatDayPeriod(hours.sunday);

  // Se segunda a sexta forem iguais
  let weekdays = `Segunda a Sexta: ${mon}`;
  if (mon !== tue || mon !== wed || mon !== thu || mon !== fri) {
    weekdays = `Segunda a Sexta: ${mon !== 'Fechado' ? mon : 'Consulte horários'}`;
  }

  return {
    weekdays,
    saturday: `Sábado: ${sat}`,
    sunday: `Domingo: ${sun}`,
    raw: hours,
  };
}

/**
 * Gera URL segura para abertura no Google Maps.
 */
export function getMapsUrl(settings?: SiteSettingsRecord | SiteSettingsData | null): string | null {
  const detailed =
    (settings as SiteSettingsRecord)?.settings?.address ||
    (settings as SiteSettingsData)?.address;

  // 1. URL customizada se for HTTPS
  if (detailed?.mapsUrl && detailed.mapsUrl.startsWith('https://')) {
    return detailed.mapsUrl.trim();
  }

  // 2. Monta a partir dos campos estruturados
  if (detailed && (detailed.street || detailed.city)) {
    const parts = [
      detailed.street,
      detailed.number,
      detailed.neighborhood,
      detailed.city,
      detailed.state,
      detailed.cep,
    ].filter(Boolean);

    if (parts.length > 0) {
      const query = encodeURIComponent(parts.join(', '));
      return `https://www.google.com/maps/search/?api=1&query=${query}`;
    }
  }

  // 3. Monta a partir do endereço em texto livre
  const addressText = (settings as SiteSettingsRecord)?.address;
  if (addressText && addressText.trim().length > 3 && addressText !== CONSTANTS.STORE_ADDRESS) {
    const query = encodeURIComponent(addressText.trim());
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  return null;
}
