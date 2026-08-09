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
    globalThis.fetch = fetchMock;
    globalThis.caches = {
      open: async () =>
        ({
          match: async () => undefined,
          put: async () => {
            throw new Error("quota exceeded");
          },
        }) as unknown as Cache,
    } as CacheStorage;
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
    );
    globalThis.caches = {
      open: async () =>
        ({
          match: async () => undefined,
          put: putMock,
        }) as unknown as Cache,
    } as CacheStorage;

    const response = await cachedFetch("https://example.com/tts", {
      method: "POST",
    });

    expect(response.status).toBe(401);
    expect(putMock).not.toHaveBeenCalled();
  });
});
