import { afterEach, describe, expect, mock, test } from "bun:test";
import { cachedFetch } from "../src/utils/cachedFetch";

const originalCaches = globalThis.caches;
const originalFetch = globalThis.fetch;
const originalWarn = console.warn;

afterEach(() => {
  globalThis.caches = originalCaches;
  globalThis.fetch = originalFetch;
  console.warn = originalWarn;
});

describe("cachedFetch", () => {
  test("does not repeat the request when writing to the cache fails", async () => {
    const fetchMock = mock(async () => new Response("audio"));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    globalThis.caches = {
      delete: async () => true,
      open: async () =>
        ({
          match: async () => undefined,
          put: async () => {
            throw new Error("quota exceeded");
          },
        }) as unknown as Cache,
    } as unknown as CacheStorage;
    console.warn = mock(() => {});

    const response = await cachedFetch("https://example.com/tts", {
      body: "hello",
      method: "POST",
    });

    expect(await response.text()).toBe("audio");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("does not cache unsuccessful responses", async () => {
    const putMock = mock(async () => {});
    globalThis.fetch = mock(
      async () => new Response("unauthorized", { status: 401 }),
    ) as unknown as typeof fetch;
    globalThis.caches = {
      delete: async () => true,
      open: async () =>
        ({
          match: async () => undefined,
          put: putMock,
        }) as unknown as Cache,
    } as unknown as CacheStorage;

    const response = await cachedFetch("https://example.com/tts", {
      method: "POST",
    });

    expect(response.status).toBe(401);
    expect(putMock).not.toHaveBeenCalled();
  });

  test("hashes secrets and text in cache keys", async () => {
    let cacheKey = "";
    globalThis.fetch = mock(
      async () => new Response("audio"),
    ) as unknown as typeof fetch;
    globalThis.caches = {
      delete: async () => true,
      open: async () =>
        ({
          match: async (request: RequestInfo | URL) => {
            cacheKey = request.toString();
            return undefined;
          },
          put: async () => {},
        }) as unknown as Cache,
    } as unknown as CacheStorage;

    await cachedFetch("https://example.com/tts", {
      body: "private utterance",
      headers: new Headers({ "xi-api-key": "secret-key" }),
      method: "POST",
    });

    expect(cacheKey).toContain("__speech_provider_cache=");
    expect(cacheKey).not.toContain("secret-key");
    expect(cacheKey).not.toContain("private");
  });
});
