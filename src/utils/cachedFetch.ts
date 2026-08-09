interface CachedFetchOptions extends RequestInit {
  additionalHeaders?: Record<string, string>;
  cacheOptions?: {
    maxAge?: number | null; // null or 0 to disable caching
    skipCache?: boolean;
  };
}

async function serializeBody(body: BodyInit | null | undefined) {
  if (body == null) {
    return new Uint8Array();
  }
  if (typeof body === "string" || body instanceof URLSearchParams) {
    return new TextEncoder().encode(body.toString());
  }
  if (body instanceof Blob) {
    return new Uint8Array(await body.arrayBuffer());
  }
  if (body instanceof ArrayBuffer) {
    return new Uint8Array(body);
  }
  if (ArrayBuffer.isView(body)) {
    return new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
  }
  return null;
}

async function createCacheKey(
  url: string,
  method: string,
  headers: Headers,
  body: BodyInit | null | undefined,
): Promise<string | null> {
  if (!globalThis.crypto?.subtle) {
    return null;
  }

  const bodyBytes = await serializeBody(body);
  if (!bodyBytes) {
    return null;
  }

  const headerEntries: [string, string][] = [];
  headers.forEach((value, key) => headerEntries.push([key, value]));
  headerEntries.sort(([left], [right]) => left.localeCompare(right));
  const metadataBytes = new TextEncoder().encode(
    JSON.stringify({ headers: headerEntries, method, url }),
  );
  const fingerprint = new Uint8Array(
    Uint32Array.BYTES_PER_ELEMENT + metadataBytes.length + bodyBytes.length,
  );
  new DataView(fingerprint.buffer).setUint32(0, metadataBytes.length);
  fingerprint.set(metadataBytes, Uint32Array.BYTES_PER_ELEMENT);
  fingerprint.set(
    bodyBytes,
    Uint32Array.BYTES_PER_ELEMENT + metadataBytes.length,
  );

  const digest = await crypto.subtle.digest("SHA-256", fingerprint);
  const digestHex = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const cacheUrl = new URL(url);
  cacheUrl.search = `__speech_provider_cache=${digestHex}`;
  cacheUrl.hash = "";
  return cacheUrl.toString();
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
  const headers = new Headers(fetchOptions.headers);

  if (additionalHeaders) {
    for (const [key, value] of Object.entries(additionalHeaders)) {
      headers.set(key, value);
    }
  }

  // Skip cache if requested
  if (skipCache || maxAge === null || maxAge === 0) {
    return fetch(url, {
      ...fetchOptions,
      headers,
    });
  }

  const cacheKey = await createCacheKey(
    url,
    fetchOptions.method || "GET",
    headers,
    fetchOptions.body,
  );
  if (!cacheKey) {
    return fetch(url, { ...fetchOptions, headers });
  }

  let cache: Cache | null = null;

  try {
    await caches.delete("speech-provider-cache");
    cache = await caches.open("speech-provider-cache-v2");

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
  } catch (error) {
    console.warn("Cache read error, fetching from the network:", error);
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!cache || !response.ok) {
    return response;
  }

  try {
    const responseToCache = response.clone();
    const headersWithTimestamp = new Headers(responseToCache.headers);
    headersWithTimestamp.set("x-cache-timestamp", Date.now().toString());
    const responseWithTimestamp = new Response(responseToCache.body, {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers: headersWithTimestamp,
    });

    await cache.put(cacheKey, responseWithTimestamp);
  } catch (error) {
    console.warn("Cache write error; returning the network response:", error);
  }

  return response;
}
