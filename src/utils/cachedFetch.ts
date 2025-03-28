interface CachedFetchOptions extends RequestInit {
  additionalHeaders?: Record<string, string>;
  cacheOptions?: {
    maxAge?: number | null; // null or 0 to disable caching
    skipCache?: boolean;
  };
}

/**
 * Enhanced fetch function that supports client-side response caching using the Cache API.
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
    // Open the cache
    const cache = await caches.open("speech-provider-cache");

    // Try to get from cache first
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const timestamp = cachedResponse.headers.get("x-cache-timestamp");
      if (timestamp) {
        const age = (Date.now() - parseInt(timestamp, 10)) / 1000; // Convert to seconds
        if (age < maxAge) {
          return cachedResponse;
        }
      }
    }

    // If not in cache or expired, fetch from network
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Clone the response before caching (responses can only be read once)
    const responseToCache = response.clone();

    // Add cache timestamp header
    const headersWithTimestamp = new Headers(responseToCache.headers);
    headersWithTimestamp.set("x-cache-timestamp", Date.now().toString());

    // Create a new response with the timestamp header
    const responseWithTimestamp = new Response(responseToCache.body, {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers: headersWithTimestamp,
    });

    // Cache the response
    await cache.put(cacheKey, responseWithTimestamp);

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
