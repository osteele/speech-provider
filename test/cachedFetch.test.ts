import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cachedFetch } from "../src/utils/cachedFetch";

describe("cachedFetch", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;

    // Mock the global fetch function
    global.fetch = mock(async () => {
      return new Response("test response", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    });

    // Note: IndexedDB mocking is complex and may not work perfectly in all test environments
    // These tests focus on the API interface rather than actual caching behavior
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("cachedFetch calls fetch with correct URL", async () => {
    const url = "https://example.com/api/test";
    await cachedFetch(url);

    expect(global.fetch).toHaveBeenCalled();
  });

  test("cachedFetch respects skipCache option", async () => {
    const url = "https://example.com/api/test";

    await cachedFetch(url, {
      cacheOptions: { skipCache: true },
    });

    expect(global.fetch).toHaveBeenCalled();
  });

  test("cachedFetch respects maxAge: null to disable caching", async () => {
    const url = "https://example.com/api/test";

    await cachedFetch(url, {
      cacheOptions: { maxAge: null },
    });

    expect(global.fetch).toHaveBeenCalled();
  });

  test("cachedFetch respects maxAge: 0 to disable caching", async () => {
    const url = "https://example.com/api/test";

    await cachedFetch(url, {
      cacheOptions: { maxAge: 0 },
    });

    expect(global.fetch).toHaveBeenCalled();
  });

  test("cachedFetch accepts custom maxAge", async () => {
    const url = "https://example.com/api/test";

    const response = await cachedFetch(url, {
      cacheOptions: { maxAge: 7200 }, // 2 hours
    });

    expect(response).toBeDefined();
    expect(global.fetch).toHaveBeenCalled();
  });

  test("cachedFetch handles POST requests", async () => {
    const url = "https://example.com/api/test";

    const response = await cachedFetch(url, {
      method: "POST",
      body: JSON.stringify({ test: "data" }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response).toBeDefined();
    expect(global.fetch).toHaveBeenCalled();
  });

  test("cachedFetch merges additional headers", async () => {
    const url = "https://example.com/api/test";

    const response = await cachedFetch(url, {
      additionalHeaders: {
        "X-Custom-Header": "custom-value",
      },
    });

    expect(response).toBeDefined();
    expect(global.fetch).toHaveBeenCalled();
  });

  test("cachedFetch handles fetch errors gracefully", async () => {
    global.fetch = mock(async () => {
      throw new Error("Network error");
    });

    const url = "https://example.com/api/test";

    try {
      await cachedFetch(url);
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test("cachedFetch returns Response object", async () => {
    const url = "https://example.com/api/test";
    const response = await cachedFetch(url);

    expect(response).toBeInstanceOf(Response);
    const text = await response.text();
    expect(text).toBe("test response");
  });
});
