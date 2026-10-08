import { getBaseSiteUrl } from '../seo/config.ts';

export interface SiteDomainInfo {
  /**
   * Complete URL with protocol, e.g. "https://afmotos.com.br" or "http://localhost:3000"
   */
  fullUrl: string;
  /**
   * Clean domain suitable for display/printing in PDF headers, e.g. "afmotos.com.br" or "localhost:3000"
   */
  displayDomain: string;
}

/**
 * Normalizes any URL or domain into a clean display domain and a valid absolute URL.
 */
export function formatSiteDomain(inputUrlOrDomain?: string | null): SiteDomainInfo {
  if (!inputUrlOrDomain || !inputUrlOrDomain.trim()) {
    const fallback = getBaseSiteUrl();
    const cleanDisplay = fallback.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    return {
      fullUrl: fallback,
      displayDomain: cleanDisplay,
    };
  }

  const raw = inputUrlOrDomain.trim();
  const noTrailing = raw.replace(/\/+$/, '');

  let fullUrl: string;
  let displayDomain: string;

  if (noTrailing.startsWith('http://') || noTrailing.startsWith('https://')) {
    fullUrl = noTrailing;
    displayDomain = noTrailing.replace(/^https?:\/\//i, '');
  } else {
    const isLocal = noTrailing.startsWith('localhost') || noTrailing.startsWith('127.0.0.1');
    fullUrl = `${isLocal ? 'http' : 'https'}://${noTrailing}`;
    displayDomain = noTrailing;
  }

  return { fullUrl, displayDomain };
}

/**
 * Resolves the current site domain based on the request (browser request headers),
 * browser window context, or site configuration fallbacks.
 */
export function resolveCurrentSiteDomain(
  request?: Request | { headers?: Headers | { get(name: string): string | null } } | null,
  overrideOrFallback?: string | null,
): SiteDomainInfo {
  if (overrideOrFallback && overrideOrFallback.trim()) {
    return formatSiteDomain(overrideOrFallback);
  }

  // 1. If request is provided, inspect HTTP headers sent by the browser
  if (request && typeof request === 'object' && 'headers' in request && request.headers) {
    const headers = request.headers;
    const xForwardedHost = headers.get('x-forwarded-host');
    const host = headers.get('host');
    const xForwardedProto = headers.get('x-forwarded-proto');
    const origin = headers.get('origin');
    const referer = headers.get('referer');

    const candidateHost = xForwardedHost || host;
    if (candidateHost && candidateHost.trim()) {
      const cleanHost = candidateHost.split(',')[0].trim();
      const isLocal = cleanHost.startsWith('localhost') || cleanHost.startsWith('127.0.0.1');
      const proto = xForwardedProto || (isLocal ? 'http' : 'https');
      return formatSiteDomain(`${proto}://${cleanHost}`);
    }

    if (origin && origin.trim()) {
      return formatSiteDomain(origin.trim());
    }

    if (referer && referer.trim()) {
      try {
        const parsed = new URL(referer);
        return formatSiteDomain(parsed.origin);
      } catch {
        // ignore invalid referer URL
      }
    }
  }

  // 2. Browser window context if executed on client
  if (typeof window !== 'undefined' && window.location?.origin) {
    return formatSiteDomain(window.location.origin);
  }

  // 3. Fallback to configured canonical site URL
  return formatSiteDomain(getBaseSiteUrl());
}

export interface StoreInstagramInfo {
  /**
   * Complete URL with protocol, e.g. "https://www.instagram.com/afveiculospe/"
   */
  fullUrl: string;
  /**
   * Clean handle suitable for display in PDF headers, e.g. "@afveiculospe"
   */
  displayHandle: string;
}

/**
 * Extracts and formats the store's Instagram information from database site_settings
 * or raw Instagram handle/URL string.
 */
export function formatStoreInstagram(inputOrSettings?: any): StoreInstagramInfo | null {
  if (!inputOrSettings) return null;

  let raw: string | null = null;
  if (typeof inputOrSettings === 'string') {
    raw = inputOrSettings;
  } else if (typeof inputOrSettings === 'object') {
    if (Array.isArray(inputOrSettings.socialLinks)) {
      const item = inputOrSettings.socialLinks.find(
        (l: any) => l?.key === 'instagram' || l?.label?.toLowerCase() === 'instagram',
      );
      if (item?.href) raw = item.href;
    }
    if (!raw) {
      raw =
        inputOrSettings.settings?.socialLinks?.instagram ||
        inputOrSettings.settings?.instagram_url ||
        inputOrSettings.socialLinks?.instagram ||
        inputOrSettings.social_links?.instagram ||
        inputOrSettings.instagram_url ||
        inputOrSettings.instagram ||
        null;
    }
  }

  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const clean = trimmed.split('?')[0].split('#')[0].replace(/\/+$/, '');
  let username = '';
  let fullUrl = '';

  if (/instagram\.com/i.test(clean)) {
    const after = clean.split(/instagram\.com\/?/i)[1];
    username = after ? after.split('/')[0].replace(/^@+/, '').trim() : '';
    fullUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, '')}`;
  } else {
    username = clean.replace(/^@+/, '').trim();
    fullUrl = `https://www.instagram.com/${username}/`;
  }

  if (!username) return null;

  return {
    fullUrl,
    displayHandle: `@${username}`,
  };
}

