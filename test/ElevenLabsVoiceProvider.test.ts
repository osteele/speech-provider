import { describe, expect, test, mock } from "bun:test";
import { ElevenLabsVoiceProvider, ELEVEN_LABS_BASE_URL } from "../src/ElevenLabsVoiceProvider";

describe("ElevenLabsVoiceProvider", () => {
  // Store the original fetch function
  const originalFetch = global.fetch;

  test("creates a provider with default options", () => {
    const provider = new ElevenLabsVoiceProvider("fake-api-key");
    expect(provider.name).toBe("ElevenLabs");
    expect(provider.apiKey).toBe("fake-api-key");
  });

  test("creates a provider with custom options", () => {
    const provider = new ElevenLabsVoiceProvider("fake-api-key", ELEVEN_LABS_BASE_URL, {
      normalizeVolume: true,
      validateResponses: true,
      printVoiceProperties: true,
      cacheMaxAge: 7200,
    });
    
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
      await expect(provider.getVoices({ lang: "en-US", minVoices: 1 })).rejects.toThrow(
        "Failed to fetch voices: 401 Unauthorized"
      );
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
      await expect(provider.getVoices({ lang: "en-US", minVoices: 1 })).rejects.toThrow(
        "Invalid response format from Eleven Labs API"
      );
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
      await expect(provider.getVoices({ lang: "en-US", minVoices: 1 })).rejects.toThrow(
        "Invalid response format from Eleven Labs API"
      );
    });
  });
  
  // Add cleanup test that runs last
  test("cleanup: restore original fetch", () => {
    // Restore the original fetch function
    global.fetch = originalFetch;
  });
});