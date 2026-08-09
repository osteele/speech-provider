import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  ELEVEN_LABS_BASE_URL,
  ElevenLabsUtterance,
  ElevenLabsVoiceProvider,
} from "../src/ElevenLabsVoiceProvider";

const originalAudio = globalThis.Audio;
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.Audio = originalAudio;
  globalThis.fetch = originalFetch;
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
        validateResponses: true,
        printVoiceProperties: true,
        cacheMaxAge: 7200,
      },
    );

    expect(provider.normalizeVolume).toBe(true);
  });

  describe("getVoices", () => {
    test("handles successful API response with matching voices", async () => {
      // Mock a successful response with voices
      const mockFetch = mock(async () => ({
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
            {
              voice_id: "voice2",
              name: "Voice 2",
              labels: { language: "es" },
              description: "Another test voice",
            },
          ],
        }),
      }));

      // Replace global fetch with our mock
      global.fetch = mockFetch;

      const provider = new ElevenLabsVoiceProvider("fake-api-key");
      const voices = await provider.getVoices({ lang: "en-US", minVoices: 1 });

      expect(voices.length).toBe(1);
      expect(voices[0].id).toBe("voice1");
      expect(voices[0].name).toBe("Voice 1");
    });

    test("returns all voices when none match the language", async () => {
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
      global.fetch = mockFetch;

      const provider = new ElevenLabsVoiceProvider("fake-api-key");
      const voices = await provider.getVoices({ lang: "en-US", minVoices: 1 });

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
      global.fetch = mockFetch;

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
      global.fetch = mockFetch;

      const provider = new ElevenLabsVoiceProvider("fake-api-key");

      // Should throw a descriptive error
      await expect(
        provider.getVoices({ lang: "en-US", minVoices: 1 }),
      ).rejects.toThrow("Invalid response format from Eleven Labs API");
    });

    test("handles voices with missing properties", async () => {
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
      global.fetch = mockFetch;

      const provider = new ElevenLabsVoiceProvider("fake-api-key");
      const voices = await provider.getVoices({ lang: "en-US", minVoices: 1 });

      // Should handle missing properties without crashing
      expect(voices.length).toBe(2); // Should include all voices since none match
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
      global.fetch = mockFetch;

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
      global.fetch = mockFetch;

      const provider = new ElevenLabsVoiceProvider("fake-api-key");

      // Should throw a descriptive error
      await expect(
        provider.getVoices({ lang: "en-US", minVoices: 1 }),
      ).rejects.toThrow("Invalid response format from Eleven Labs API");
    });
  });

  test("uses the custom base URL for voice discovery and synthesis", async () => {
    const requestedUrls: string[] = [];
    globalThis.fetch = mock(async (input: string | URL | Request) => {
      const url = input.toString();
      requestedUrls.push(url);
      if (url.includes("/voices?")) {
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
      return new Response(new Blob(["audio"]), { status: 200 });
    });

    class FakeAudio {
      onended: (() => void) | null = null;
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
      "https://proxy.example/v1/voices?language=en",
      "https://proxy.example/v1/text-to-speech/voice1",
    ]);
  });
});

describe("ElevenLabsUtterance", () => {
  test("reports synthesis HTTP errors before decoding audio", async () => {
    globalThis.fetch = mock(
      async () =>
        new Response("rate limited", {
          status: 429,
          statusText: "Too Many Requests",
        }),
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
});
