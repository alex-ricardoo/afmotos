type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

class FipexMemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  /**
   * Obtém um valor do cache se ainda válido.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Armazena um valor no cache com TTL em segundos.
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Remove uma chave específica.
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpa todo o cache em memória.
   */
  clear(): void {
    this.cache.clear();
  }
}

export const fipexCache = new FipexMemoryCache();

// TTLs recomendados em segundos
export const FIPEX_CACHE_TTL = {
  PRELUDE: 3600, // 1 hora
  BRANDS: 900, // 15 minutos
  MODELS: 900, // 15 minutos
  MODEL_DETAIL: 900, // 15 minutos
  PERIODS: 3600, // 1 hora
  HISTORY: 300, // 5 minutos
} as const;
