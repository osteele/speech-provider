import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  ELEVEN_LABS_BASE_URL,
  ElevenLabsUtterance,
  ElevenLabsVoiceProvider,
} from "../src/ElevenLabsVoiceProvider";

const originalAudio = globalThis.Audio;
const originalCreateObjectUrl = URL.createObjectURL;
const originalFetch = globalThis.fetch;
const originalRevokeObjectUrl = URL.revokeObjectURL;

function setFetch(fetchMock: unknown): void {
  globalThis.fetch = fetchMock as typeof fetch;
}

afterEach(() => {
  globalThis.Audio = originalAudio;
  globalThis.fetch = originalFetch;
  URL.createObjectURL = originalCreateObjectUrl;
  URL.revokeObjectURL = originalRevokeObjectUrl;
});

describe("ElevenLabsVoiceProvider", () => {
  test("creates a provider with default options", () => {
    const provider = new ElevenLabsVoiceProvider("fake-api-key");
    expect(provider.name).toBe("ElevenLabs");
    expect(provider.apiKey).toBe("fake-api-key");
  });

  test("creates a provider with custom options", () => {
    const provider = new ElevenLabsVoiceProvider(
      "fake-api-key",
      ELEVEN_LABS_BASE_URL,
      {
        normalizeVolume: true,
        printVoiceProperties: true,
        cacheMaxAge: 7200,
      },
    );

    expect(provider.normalizeVolume).toBe(true);
  });

  describe("getVoices", () => {
    test("handles successful API response with matching voices", async () => {
      // Mock a successful response with voices
      const mockFetch = mock(async (input: string | URL | Request) => ({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({
          voices: [
            {
              voice_id: "voice1",
              name: "Voice 1",
              labels: {},
              verified_languages: [{ language: "en", locale: "en-US" }],
              description: "A test voice",
            },
            {
              voice_id: "voice2",
              name: "Voice 2",
              labels: { language: "es" },
              description: "Another test voice",
            },
          ],
        }),
        url: input.toString(),
      }));

      // Replace global fetch with our mock
      setFetch(mockFetch);

      const provider = new ElevenLabsVoiceProvider("fake-api-key");
      const voices = await provider.getVoices({ lang: "en-US", minVoices: 1 });

      expect(voices.length).toBe(1);
      expect(voices[0].id).toBe("voice1");
      expect(voices[0].name).toBe("Voice 1");
      expect(mockFetch.mock.calls[0][0].toString()).toBe(
        "https://api.elevenlabs.io/v2/voices?page_size=100",
      );
    });

    test("returns unrelated voices only when explicitly requested", async () => {
      // Mock a successful response with voices, but none match the requested language
      const mockFetch = mock(async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({
          voices: [
            {
              voice_id: "voice1",
              name: "Voice 1",
              labels: { language: "es" },
              description: "A test voice",
            },
            {
              voice_id: "voice2",
              name: "Voice 2",
              labels: { language: "fr" },
              description: "Another test voice",
            },
          ],
        }),
      }));

      // Replace global fetch with our mock
      setFetch(mockFetch);

      const provider = new ElevenLabsVoiceProvider("fake-api-key");
      const voices = await provider.getVoices({
        lang: "en-US",
        minVoices: 1,
        fallbackToAnyLanguage: true,
      });

      // Should return all voices if none match and minVoices is not satisfied
      expect(voices.length).toBe(2);
    });

    test("handles API failure with meaningful error", async () => {
      // Mock a failed API response
      const mockFetch = mock(async () => ({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ error: "Invalid API key" }),
      }));

      // Replace global fetch with our mock
      setFetch(mockFetch);

      const provider = new ElevenLabsVoiceProvider("fake-api-key");

      // Should throw a descriptive error
      await expect(
        provider.getVoices({ lang: "en-US", minVoices: 1 }),
      ).rejects.toThrow("Invalid or missing API key");
    });

    test("handles malformed API response", async () => {
      // Mock a successful but malformed response
      const mockFetch = mock(async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({
          // Missing voices array
          result: "success",
        }),
      }));

      // Replace global fetch with our mock
      setFetch(mockFetch);

      const provider = new ElevenLabsVoiceProvider("fake-api-key");

      // Should throw a descriptive error
      await expect(
        provider.getVoices({ lang: "en-US", minVoices: 1 }),
      ).rejects.toThrow("Invalid response format from Eleven Labs API");
    });

    test("handles voices without language labels", async () => {
      // Mock a response with incomplete voice data
      const mockFetch = mock(async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({
          voices: [
            {
              voice_id: "voice1",
              name: "Voice 1",
              // Missing labels property
              description: "A test voice",
            },
            {
              voice_id: "voice2",
              name: "Voice 2",
              labels: {
                // Missing language property
                gender: "female",
              },
              description: "Another test voice",
            },
          ],
        }),
      }));

      // Replace global fetch with our mock
      setFetch(mockFetch);

      const provider = new ElevenLabsVoiceProvider("fake-api-key");
      const voices = await provider.getVoices({ lang: "en-US", minVoices: 1 });

      expect(voices).toHaveLength(2);
      expect(voices.every((voice) => voice.lang === "en-US")).toBe(true);
    });

    test("rejects voices without an identifier", async () => {
      setFetch(
        mock(async () => ({
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => ({ voices: [{ labels: {} }] }),
        })),
      );
      const provider = new ElevenLabsVoiceProvider("fake-api-key");

      await expect(
        provider.getVoices({ lang: "en-US", minVoices: 1 }),
      ).rejects.toThrow("Invalid response format from Eleven Labs API");
    });

    test("handles empty voices array", async () => {
      // Mock a response with an empty voices array
      const mockFetch = mock(async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({
          voices: [],
        }),
      }));

      // Replace global fetch with our mock
      setFetch(mockFetch);

      const provider = new ElevenLabsVoiceProvider("fake-api-key");
      const voices = await provider.getVoices({ lang: "en-US", minVoices: 1 });

      // Should return an empty array
      expect(voices.length).toBe(0);
    });

    test("handles null response", async () => {
      // Mock a null response
      const mockFetch = mock(async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => null,
      }));

      // Replace global fetch with our mock
      setFetch(mockFetch);

      const provider = new ElevenLabsVoiceProvider("fake-api-key");

      // Should throw a descriptive error
      await expect(
        provider.getVoices({ lang: "en-US", minVoices: 1 }),
      ).rejects.toThrow("Invalid response format from Eleven Labs API");
    });
  });

  test("uses the custom base URL for voice discovery and synthesis", async () => {
    const requestedUrls: string[] = [];
    const requestedModels: string[] = [];
    setFetch(
      mock(async (input: string | URL | Request, init?: RequestInit) => {
        const url = input.toString();
        requestedUrls.push(url);
        if (url.endsWith("/voices")) {
          return {
            ok: true,
            status: 200,
            statusText: "OK",
            json: async () => ({
              voices: [
                {
                  voice_id: "voice1",
                  name: "Voice 1",
                  labels: { language: "en" },
                  description: "A test voice",
                },
              ],
            }),
          } as Response;
        }
        const body = JSON.parse(String(init?.body)) as { model_id: string };
        requestedModels.push(body.model_id);
        return new Response(new Blob(["audio"]), { status: 200 });
      }),
    );

    class FakeAudio {
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onplay: (() => void) | null = null;

      pause() {}

      async play() {
        this.onplay?.();
      }
    }

    globalThis.Audio = FakeAudio as unknown as typeof Audio;

    const provider = new ElevenLabsVoiceProvider(
      "fake-api-key",
      "https://proxy.example/v1",
      { cacheMaxAge: null },
    );
    const [voice] = await provider.getVoices({ lang: "en-US", minVoices: 1 });
    await voice.createUtterance("Hello").start();

    expect(requestedUrls).toEqual([
      "https://proxy.example/v1/voices",
      "https://proxy.example/v1/text-to-speech/voice1",
    ]);
    expect(requestedModels).toEqual(["eleven_flash_v2_5"]);
  });
});

describe("ElevenLabsUtterance", () => {
  test("reports synthesis HTTP errors before decoding audio", async () => {
    setFetch(
      mock(
        async () =>
          new Response("rate limited", {
            status: 429,
            statusText: "Too Many Requests",
          }),
      ),
    );
    const utterance = new ElevenLabsUtterance(
      "fake-api-key",
      "voice1",
      "en",
      "Hello",
      null,
    );

    await expect(utterance.start()).rejects.toThrow(
      "Failed to synthesize speech: 429 Too Many Requests",
    );
  });

  test("reports errors through the onerror callback", async () => {
    setFetch(mock(async () => new Response("unauthorized", { status: 401 })));
    const onError = mock(() => {});
    const utterance = new ElevenLabsUtterance(
      "fake-api-key",
      "voice1",
      "en",
      "Hello",
      null,
    );
    utterance.onerror = onError;

    await expect(utterance.start()).rejects.toThrow(
      "Invalid or missing API key",
    );
    expect(onError).toHaveBeenCalledTimes(1);
  });

  test("stop aborts synthesis that is still pending", async () => {
    const requestSignals: AbortSignal[] = [];
    setFetch(
      mock(
        (_input: string | URL | Request, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            if (!init?.signal) {
              return;
            }
            requestSignals.push(init.signal);
            init.signal.addEventListener("abort", () => {
              reject(new DOMException("Aborted", "AbortError"));
            });
          }),
      ),
    );
    const utterance = new ElevenLabsUtterance(
      "fake-api-key",
      "voice1",
      "en",
      "Hello",
      null,
    );

    const startPromise = utterance.start();
    await Promise.resolve();
    await Promise.resolve();
    await utterance.stop();
    await startPromise;

    expect(requestSignals[0]?.aborted).toBe(true);
  });

  test("stop releases HTML audio and its object URL", async () => {
    const pauseMock = mock(() => {});
    const revokeObjectUrl = mock(() => {});
    URL.createObjectURL = mock(() => "blob:test-audio");
    URL.revokeObjectURL = revokeObjectUrl;
    setFetch(mock(async () => new Response(new Blob(["audio"]))));

    class FakeAudio {
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onplay: (() => void) | null = null;
      pause = pauseMock;

      async play() {
        this.onplay?.();
      }
    }
    globalThis.Audio = FakeAudio as unknown as typeof Audio;
    const utterance = new ElevenLabsUtterance(
      "fake-api-key",
      "voice1",
      "en",
      "Hello",
      null,
    );

    await utterance.start();
    await utterance.stop();

    expect(pauseMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:test-audio");
  });
});
