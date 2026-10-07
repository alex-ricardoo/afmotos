export const PUBLIC_CATALOG_TAG = 'public-motorcycles';

/**
 * Revalida centralizadamente o cache de dados e páginas públicas do catálogo de motos.
 * Deve ser invocada sempre que uma moto for criada, editada, vendida, excluída,
 * tiver status alternado ou tiver suas imagens alteradas.
 */
export async function revalidatePublicCatalog(slug?: string | null): Promise<void> {
  const startTime = Date.now();

  let nextCache: any = null;
  try {
    // Tenta carregar next/cache (bundler Next.js) ou next/cache.js (Node ESM puro em testes)
    nextCache = await import('next/cache').catch(() =>
      import('next/cache.js').catch(() => null),
    );
  } catch {
    nextCache = null;
  }

  const pathsToRevalidate = ['/', '/motos', '/motos-vendidas', '/sitemap.xml'];
  if (slug && typeof slug === 'string' && slug.trim().length > 0) {
    pathsToRevalidate.push(`/motos/${slug.trim()}`);
  }

  if (nextCache) {
    if (typeof nextCache.revalidateTag === 'function') {
      try {
        nextCache.revalidateTag(PUBLIC_CATALOG_TAG, 'max');
      } catch (err) {
        console.warn('[PUBLIC_CATALOG_REVALIDATE] Aviso ao revalidar tag:', err);
      }
    }

    if (typeof nextCache.revalidatePath === 'function') {
      for (const p of pathsToRevalidate) {
        try {
          nextCache.revalidatePath(p);
        } catch (err) {
          console.warn(`[PUBLIC_CATALOG_REVALIDATE] Aviso ao revalidar path ${p}:`, err);
        }
      }
    }
  }

  const durationMs = Date.now() - startTime;
  console.info('[PUBLIC_CATALOG_REVALIDATE]', {
    event: 'catalog_cache_invalidated',
    tag: PUBLIC_CATALOG_TAG,
    revalidatedPaths: pathsToRevalidate,
    slug: slug || null,
    durationMs,
  });
}
