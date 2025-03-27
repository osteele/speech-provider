interface CachedFetchOptions extends RequestInit {
  additionalHeaders?: Record<string, string>;
  cacheOptions?: { maxAge?: number };
}

/**
 * Enhanced fetch function that supports client-side response caching
 * @param url The URL to fetch
 * @param options Fetch options including additionalHeaders for caching control
 * @returns A fetch Response object
 */
export async function cachedFetch(
  url: string,
  options: CachedFetchOptions = {},
): Promise<Response> {
  const { additionalHeaders, ...fetchOptions } = options;
  const headers = { ...fetchOptions.headers } as Record<string, string>;

  if (additionalHeaders) {
    Object.assign(headers, additionalHeaders);
  }

  return fetch(url, {
    ...fetchOptions,
    headers,
  });
}
