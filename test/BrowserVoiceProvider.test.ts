import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import {
  BrowserVoiceProvider,
  browserVoiceProvider,
} from "../src/BrowserVoiceProvider";

const originalSpeechSynthesisUtterance = globalThis.SpeechSynthesisUtterance;
const originalWindow = globalThis.window;

describe("BrowserVoiceProvider", () => {
  // Mock the window.speechSynthesis object
  const mockVoices = [
    {
      name: "Voice1 (Description)",
      lang: "en-US",
      default: true,
      voiceURI: "voice1",
      localService: true,
    },
    {
      name: "Voice2 (Another Description)",
      lang: "en-GB",
      default: false,
      voiceURI: "voice2",
      localService: true,
    },
    {
      name: "Voice3 (Chinese (Mandarin))",
      lang: "zh-CN",
      default: false,
      voiceURI: "voice3",
      localService: true,
    },
  ];

  beforeEach(() => {
    globalThis.SpeechSynthesisUtterance = class {
      lang = "";
      onend: ((event: SpeechSynthesisEvent) => void) | null = null;
      onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null;
      onstart: ((event: SpeechSynthesisEvent) => void) | null = null;
      voice: SpeechSynthesisVoice | null = null;

      constructor(public text: string) {}
    } as unknown as typeof SpeechSynthesisUtterance;

    // Create a mock for window.speechSynthesis
    global.window = {
      speechSynthesis: {
        getVoices: () => mockVoices,
        speak: mock(() => {}),
        cancel: mock(() => {}),
      },
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    globalThis.SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
    globalThis.window = originalWindow;
  });

  test("getVoices returns voices for an exact language match", async () => {
    const voices = await browserVoiceProvider.getVoices({
      lang: "en-US",
      minVoices: 1,
    });

    expect(voices.length).toBe(1);
    expect(voices[0].name).toBe("Voice1");
    expect(voices[0].description).toBe("Description");
    expect(voices[0].id).toBe("voice1");
    expect(voices[0].lang).toBe("en-US");
  });

  test("getVoices returns voices for a language prefix match", async () => {
    const voices = await browserVoiceProvider.getVoices({
      lang: "en",
      minVoices: 1,
    });

    expect(voices.length).toBe(2);
    expect(voices[0].name).toBe("Voice1");
    expect(voices[1].name).toBe("Voice2");
  });

  test("getVoices returns all voices when no matches meet minVoices", async () => {
    const voices = await browserVoiceProvider.getVoices({
      lang: "fr-FR",
      minVoices: 1,
      fallbackToAnyLanguage: true,
    });

    expect(voices.length).toBe(3);
  });

  test("getDefaultVoice returns the default voice for a language", async () => {
    const voice = await browserVoiceProvider.getDefaultVoice({
      lang: "en-US",
    });

    expect(voice?.name).toBe("Voice1");
    expect(voice?.isDefault).toBe(true);
  });

  test("getDefaultVoice returns the first voice when no default", async () => {
    // Mock no default voice for en-GB
    const voice = await browserVoiceProvider.getDefaultVoice({
      lang: "en-GB",
    });

    expect(voice?.name).toBe("Voice2");
  });

  test("getVoices does not return unrelated voices by default", async () => {
    const voices = await browserVoiceProvider.getVoices({
      lang: "fr-FR",
      minVoices: 1,
    });

    expect(voices).toEqual([]);
  });

  test("waits for voices after an earlier server-side call", async () => {
    const provider = new BrowserVoiceProvider();
    globalThis.window = undefined as unknown as Window & typeof globalThis;
    expect(await provider.getVoices({ lang: "en-US", minVoices: 1 })).toEqual(
      [],
    );

    globalThis.window = {
      speechSynthesis: {
        getVoices: () => mockVoices,
      },
    } as unknown as Window & typeof globalThis;
    const voices = await provider.getVoices({ lang: "en-US", minVoices: 1 });
    expect(voices).toHaveLength(1);
  });

  test("preserves multi-word voice names", async () => {
    globalThis.window.speechSynthesis.getVoices = () => [
      {
        ...mockVoices[0],
        name: "Microsoft David Desktop",
      } as SpeechSynthesisVoice,
    ];
    const provider = new BrowserVoiceProvider();
    const [voice] = await provider.getVoices({ lang: "en-US", minVoices: 1 });
    expect(voice.name).toBe("Microsoft David Desktop");
  });

  test("createUtterance returns a functioning utterance", async () => {
    const voices = await browserVoiceProvider.getVoices({
      lang: "en-US",
      minVoices: 1,
    });

    const utterance = voices[0].createUtterance("Hello world");

    // Test start method
    await utterance.start();
    expect(global.window.speechSynthesis.speak).toHaveBeenCalled();

    // Test stop method
    await utterance.stop();
    expect(global.window.speechSynthesis.cancel).toHaveBeenCalled();

    // Test event handlers
    const onStartMock = mock(() => {});
    const onEndMock = mock(() => {});
    utterance.onstart = onStartMock;
    utterance.onend = onEndMock;

    // Verify the handlers were set
    const browserUtterance = utterance as unknown as {
      utterance: SpeechSynthesisUtterance;
    };
    expect(browserUtterance.utterance.onstart).toBe(onStartMock);
    expect(browserUtterance.utterance.onend).toBe(onEndMock);
  });
});
