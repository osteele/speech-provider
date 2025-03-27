import { browserVoiceProvider } from "./BrowserVoiceProvider";
import { createElevenLabsVoiceProvider } from "./ElevenLabsVoiceProvider";

export interface VoiceProvider {
  name: string;

  /**
   * Get the voices for a given language code.
   * @param languageCode The language code to match.
   * @param requiredVoices The number of voices required.
   * @returns The voices for the given language code.
   */
  getVoices({
    lang,
    minVoices,
  }: {
    lang: string;
    minVoices: number;
  }): Promise<Voice[]>;
  getDefaultVoice({ lang }: { lang: string }): Promise<Voice | null>;
}

export interface Voice {
  name: string;
  id: string;
  lang: string;
  provider: VoiceProvider;
  description: string | null;
  createUtterance(text: string): Utterance;
}

export interface Utterance {
  start(): void;
  stop(): void;
  set onstart(callback: () => void);
  set onend(callback: () => void);
}

export function getVoiceProvider(apiKeys: {
  elevenLabs?: string | null;
}): VoiceProvider {
  if (apiKeys.elevenLabs) {
    return createElevenLabsVoiceProvider(apiKeys.elevenLabs);
  }
  return browserVoiceProvider;
}
