import { Utterance, Voice, VoiceProvider } from "./VoiceProvider";

/**
 * A voice provider that uses the browser's built-in speech synthesis.
 * This provider is available in all modern browsers and doesn't require any API keys.
 */
export class BrowserVoiceProvider implements VoiceProvider {
  name = "Browser";

  /**
   * Get available voices for a given language code.
   * @param options - The options for getting voices
   * @param options.lang - The language code to match (e.g., "en-US")
   * @param options.minVoices - The minimum number of voices to return
   * @returns A promise that resolves to an array of browser voices
   */
  async getVoices({
    lang,
    minVoices,
  }: {
    lang: string;
    minVoices: number;
  }): Promise<BrowserSpeechSynthesisVoice[]> {
    return this.getBrowserVoicesForLanguage(lang, minVoices).map(
      (voice) => new BrowserSpeechSynthesisVoice(voice, voice.lang, this),
    );
  }

  /**
   * Get the default voice for a given language code.
   * @param options - The options for getting the default voice
   * @param options.lang - The language code to match (e.g., "en-US")
   * @returns A promise that resolves to the default voice or null if none is available
   */
  async getDefaultVoice({
    lang,
  }: {
    lang: string;
  }): Promise<BrowserSpeechSynthesisVoice | null> {
    const voices = await this.getVoices({ lang, minVoices: 1 });
    const defaultVoice = voices.find((voice) => voice.isDefault);
    if (defaultVoice) {
      return defaultVoice;
    }
    return voices?.[0] ?? null;
  }

  /**
   * Get browser voices for a given language code.
   * @param lang - The language code to match
   * @param minVoices - The minimum number of voices to return
   * @returns An array of browser voices
   * @private
   */
  private getBrowserVoicesForLanguage(
    lang: string,
    minVoices: number,
  ): SpeechSynthesisVoice[] {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return [];
    }

    const allVoices = window.speechSynthesis.getVoices();
    const exactMatch = allVoices.filter((voice) => voice.lang === lang);

    if (exactMatch.length >= minVoices) {
      return exactMatch;
    }

    const languageMatch = allVoices.filter((voice) =>
      voice.lang.startsWith(lang.slice(0, 2)),
    );

    if (languageMatch.length >= minVoices) {
      return languageMatch;
    }

    return allVoices;
  }
}

/**
 * A voice implementation that wraps the browser's SpeechSynthesisVoice.
 */
export class BrowserSpeechSynthesisVoice implements Voice {
  private voice: SpeechSynthesisVoice;

  constructor(
    voice: SpeechSynthesisVoice,
    public lang: string,
    public provider: VoiceProvider,
  ) {
    this.voice = voice;
    this.lang = lang;
  }

  /** Whether this is the default voice for its language */
  get isDefault() {
    return this.voice.default;
  }

  /** The display name of the voice */
  get name() {
    return this.voice.name.replace(/ (.+)$/, "");
  }

  /** The unique identifier for the voice */
  get id() {
    return this.voice.voiceURI;
  }

  /** The description of the voice (e.g., "English (US)") */
  get description() {
    const match = / (.+)$/.exec(this.voice.name);
    return match?.[1].replace(/\(Chinese \((.+?)\)\)/, "$1") ?? null;
  }

  /**
   * Create a new utterance with this voice.
   * @param text - The text to speak
   * @returns A new utterance that can be started and stopped
   */
  createUtterance(text: string): Utterance {
    return new BrowserSpeechSynthesisUtterance(this.voice, text, this.lang);
  }
}

/**
 * An utterance implementation that wraps the browser's SpeechSynthesisUtterance.
 */
class BrowserSpeechSynthesisUtterance implements Utterance {
  utterance: SpeechSynthesisUtterance;

  constructor(
    public voice: SpeechSynthesisVoice,
    public text: string,
    public lang: string,
  ) {
    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.lang = lang;
    this.utterance.voice = voice;
  }

  /** Start speaking the utterance */
  start() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.speak(this.utterance);
    }
  }

  /** Stop speaking the utterance */
  stop() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  /** Set the callback for when the utterance starts speaking */
  set onstart(callback: () => void) {
    this.utterance.onstart = callback;
  }

  /** Set the callback for when the utterance finishes speaking */
  set onend(callback: () => void) {
    this.utterance.onend = callback;
  }
}

/** The default browser voice provider instance */
export const browserVoiceProvider = new BrowserVoiceProvider();
