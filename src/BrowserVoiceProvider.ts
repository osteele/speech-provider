import { Utterance, Voice, VoiceProvider } from "./VoiceProvider";

export class BrowserVoiceProvider implements VoiceProvider {
  name = "Browser";

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

  get isDefault() {
    return this.voice.default;
  }

  get name() {
    return this.voice.name.replace(/ (.+)$/, "");
  }

  get id() {
    return this.voice.voiceURI;
  }

  get description() {
    const match = / (.+)$/.exec(this.voice.name);
    return match?.[1].replace(/\(Chinese \((.+?)\)\)/, "$1") ?? null;
  }

  createUtterance(text: string): Utterance {
    return new BrowserSpeechSynthesisUtterance(this.voice, text, this.lang);
  }
}

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

  start() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.speak(this.utterance);
    }
  }

  stop() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  set onstart(callback: () => void) {
    this.utterance.onstart = callback;
  }

  set onend(callback: () => void) {
    this.utterance.onend = callback;
  }
}

export const browserVoiceProvider = new BrowserVoiceProvider();
