import { describe, expect, test } from "bun:test";
import { browserVoiceProvider } from "../src/BrowserVoiceProvider";
import { getVoiceProvider } from "../src/VoiceProvider";

describe("getVoiceProvider", () => {
  test("returns browserVoiceProvider when no API key", () => {
    const provider = getVoiceProvider({});
    expect(provider).toBe(browserVoiceProvider);
  });

  test("returns browserVoiceProvider when elevenLabs API key is null", () => {
    const provider = getVoiceProvider({ elevenLabs: null });
    expect(provider).toBe(browserVoiceProvider);
  });

  test("returns ElevenLabsVoiceProvider when elevenLabs API key is provided", () => {
    const provider = getVoiceProvider({ elevenLabs: "fake-api-key" });
    expect(provider.name).toBe("ElevenLabs");
  });
});
