import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  ElevenLabsVoiceProvider,
  createElevenLabsVoiceProvider,
  ELEVEN_LABS_BASE_URL,
} from "../src/ElevenLabsVoiceProvider";
import type { ElevenLabsVoiceData } from "../src/ElevenLabsTypes";

describe("ElevenLabsVoiceProvider", () => {
  const mockApiKey = "test-api-key";
  const mockVoiceData: ElevenLabsVoiceData = {
    voice_id: "test-voice-id",
    name: "Test Voice",
    description: "Test description - Premium voice",
    category: "premade",
    labels: {
      accent: "american",
      age: "young",
      gender: "female",
      language: "en",
      use_case: "social media",
      description: "A test voice",
    },
    preview_url: "https://example.com/preview.mp3",
    samples: null,
    settings: null,
    sharing: null,
    safety_control: null,
    fine_tuning: {},
    is_legacy: false,
    is_mixed: false,
    high_quality_base_model_ids: ["model1"],
    available_for_tiers: ["plus", "pro"],
    voice_verification: {},
    permission_on_resource: null,
  };

  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    // Mock the global fetch function
    global.fetch = mock(async (url: string | URL | Request) => {
      const urlString = url.toString();
      if (urlString.includes("/voices")) {
        return new Response(
          JSON.stringify({
            voices: [mockVoiceData],
          }),
          { status: 200 },
        );
      }
      return new Response("Not found", { status: 404 });
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("createElevenLabsVoiceProvider creates a provider instance", () => {
    const provider = createElevenLabsVoiceProvider(mockApiKey);
    expect(provider).toBeInstanceOf(ElevenLabsVoiceProvider);
    expect(provider.name).toBe("ElevenLabs");
  });

  test("getVoices fetches voices from API", async () => {
    const provider = createElevenLabsVoiceProvider(mockApiKey);
    const voices = await provider.getVoices({ lang: "en-US", minVoices: 1 });

    expect(voices.length).toBeGreaterThan(0);
    expect(voices[0].name).toBe("Test Voice");
    expect(voices[0].id).toBe("test-voice-id");
  });

  test("getVoices filters by language code", async () => {
    const provider = createElevenLabsVoiceProvider(mockApiKey);
    const voices = await provider.getVoices({ lang: "en-US", minVoices: 1 });

    expect(voices.length).toBeGreaterThan(0);
    for (const voice of voices) {
      expect(voice.lang).toBe("en");
    }
  });

  test("getDefaultVoice returns the first voice", async () => {
    const provider = createElevenLabsVoiceProvider(mockApiKey);
    const voice = await provider.getDefaultVoice({ lang: "en-US" });

    expect(voice).not.toBeNull();
    expect(voice?.name).toBe("Test Voice");
  });

  test("getDefaultVoice returns null when no voices available", async () => {
    // Mock fetch to return empty voices array
    global.fetch = mock(async () => {
      return new Response(
        JSON.stringify({
          voices: [],
        }),
        { status: 200 },
      );
    });

    const provider = createElevenLabsVoiceProvider(mockApiKey);
    const voice = await provider.getDefaultVoice({ lang: "fr-FR" });

    expect(voice).toBeNull();
  });

  test("voice description parsing works correctly", async () => {
    const provider = createElevenLabsVoiceProvider(mockApiKey);
    const voices = await provider.getVoices({ lang: "en-US", minVoices: 1 });

    expect(voices[0].description).toBe("Premium voice");
  });

  test("createUtterance returns an utterance", async () => {
    const provider = createElevenLabsVoiceProvider(mockApiKey);
    const voices = await provider.getVoices({ lang: "en-US", minVoices: 1 });
    const utterance = voices[0].createUtterance("Hello, world!");

    expect(utterance).toBeDefined();
    expect(typeof utterance.start).toBe("function");
    expect(typeof utterance.stop).toBe("function");
  });

  test("provider respects custom cache settings", () => {
    const provider = createElevenLabsVoiceProvider(mockApiKey, ELEVEN_LABS_BASE_URL, {
      cacheMaxAge: 7200,
    });

    expect(provider).toBeInstanceOf(ElevenLabsVoiceProvider);
  });

  test("provider can disable caching", () => {
    const provider = createElevenLabsVoiceProvider(mockApiKey, ELEVEN_LABS_BASE_URL, {
      cacheMaxAge: null,
    });

    expect(provider).toBeInstanceOf(ElevenLabsVoiceProvider);
  });
});

// Add afterEach function if not defined in bun:test
declare function afterEach(fn: () => void): void;
