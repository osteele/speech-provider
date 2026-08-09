import { describe, expect, test } from "bun:test";
import { browserVoiceProvider } from "../src/BrowserVoiceProvider";
import type { ElevenLabsVoiceProvider } from "../src/ElevenLabsVoiceProvider";
import { getVoiceProvider } from "../src/VoiceProvider";

describe("getVoiceProvider", () => {
  test("returns browserVoiceProvider when no API key", () => {
    const provider = getVoiceProvider({});
    expect(provider).toBe(browserVoiceProvider);
  });

  test("returns browserVoiceProvider when elevenLabs API key is null", () => {
    const provider = getVoiceProvider({ elevenLabsApiKey: null });
    expect(provider).toBe(browserVoiceProvider);
  });

  test("returns ElevenLabsVoiceProvider when elevenLabs API key is provided", () => {
    const provider = getVoiceProvider({ elevenLabsApiKey: "fake-api-key" });
    expect(provider.name).toBe("ElevenLabs");
  });

  test("forwards ElevenLabs provider options", () => {
    const provider = getVoiceProvider({
      elevenLabsApiKey: "fake-api-key",
      cacheMaxAge: null,
      normalizeVolume: true,
    }) as ElevenLabsVoiceProvider;

    expect(provider.cacheMaxAge).toBeNull();
    expect(provider.normalizeVolume).toBe(true);
  });
});
