interface CachedFetchOptions extends RequestInit {
  additionalHeaders?: Record<string, string>;
  cacheOptions?: {
    maxAge?: number | null; // null or 0 to disable caching
    skipCache?: boolean;
  };
}

interface CacheEntry {
  timestamp: number;
  blob: Blob;
  headers: Record<string, string>;
}

/**
 * Enhanced fetch function that supports client-side response caching using IndexedDB.
 * Responses are cached based on the URL and request options.
 *
 * @param url The URL to fetch
 * @param options Fetch options including cache configuration
 * @returns A fetch Response object
 *
 * @example
 * ```typescript
 * // Basic usage with default 1-hour cache
 * const response = await cachedFetch('https://api.example.com/data');
 *
 * // Custom cache duration (1 day)
 * const response = await cachedFetch('https://api.example.com/data', {
 *   cacheOptions: { maxAge: 86400 }
 * });
 *
 * // Disable caching (preferred approach)
 * const response = await cachedFetch('https://api.example.com/data', {
 *   cacheOptions: { maxAge: null }
 * });
 *
 * // Alternative way to disable caching
 * const response = await cachedFetch('https://api.example.com/data', {
 *   cacheOptions: { maxAge: 0 }
 * });
 * ```
 */
export async function cachedFetch(
  url: string,
  options: CachedFetchOptions = {},
): Promise<Response> {
  const { additionalHeaders, cacheOptions = {}, ...fetchOptions } = options;
  const { maxAge = 3600, skipCache = false } = cacheOptions; // Default to 1 hour
  const headers = { ...fetchOptions.headers } as Record<string, string>;

  if (additionalHeaders) {
    Object.assign(headers, additionalHeaders);
  }

  // Skip cache if requested
  if (skipCache || maxAge === null || maxAge === 0) {
    return fetch(url, {
      ...fetchOptions,
      headers,
    });
  }

  // Create a cache key from the URL and request options
  const cacheKey = JSON.stringify({
    url,
    method: fetchOptions.method || "GET",
    headers,
    body: fetchOptions.body,
  });

  try {
    // Try to get from cache first
    const cachedResponse = await getFromCache(cacheKey);
    if (cachedResponse) {
      const entry = cachedResponse as CacheEntry;
      const age = (Date.now() - entry.timestamp) / 1000; // Convert to seconds

      if (age < maxAge) {
        return new Response(entry.blob, {
          headers: entry.headers,
        });
      }
    }

    // If not in cache or expired, fetch from network
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Clone the response before caching (responses can only be read once)
    const responseToCache = response.clone();
    const blob = await responseToCache.blob();

    // Cache the response data
    await cacheResponse(cacheKey, {
      timestamp: Date.now(),
      blob,
      headers: Object.fromEntries(responseToCache.headers.entries()),
    });

    return response;
  } catch (error) {
    // If caching fails, fall back to regular fetch
    console.warn("Cache error, falling back to regular fetch:", error);
    return fetch(url, {
      ...fetchOptions,
      headers,
    });
  }
}

// IndexedDB setup
const DB_NAME = "speech-provider-cache";
const STORE_NAME = "responses";
const DB_VERSION = 1;

async function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function getFromCache(key: string): Promise<CacheEntry | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function cacheResponse(key: string, entry: CacheEntry): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(entry, key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
