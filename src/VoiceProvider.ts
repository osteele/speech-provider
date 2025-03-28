import { browserVoiceProvider } from "./BrowserVoiceProvider";
import {
  ELEVEN_LABS_BASE_URL,
  createElevenLabsVoiceProvider,
} from "./ElevenLabsVoiceProvider";

/**
 * Interface for a voice provider that can synthesize speech.
 * A voice provider can be either the browser's built-in speech synthesis
 * or an external service like ElevenLabs.
 */
export interface VoiceProvider {
  /** The name of the voice provider */
  name: string;

  /**
   * Get the voices for a given language code.
   * @param options - The options for getting voices
   * @param options.lang - The language code to match
   * @param options.minVoices - The minimum number of voices to return
   * @returns The voices for the given language code
   */
  getVoices({
    lang,
    minVoices,
  }: {
    lang: string;
    minVoices: number;
  }): Promise<Voice[]>;

  /**
   * Get the default voice for a given language code.
   * @param options - The options for getting the default voice
   * @param options.lang - The language code to match
   * @returns The default voice for the language, or null if none is available
   */
  getDefaultVoice({ lang }: { lang: string }): Promise<Voice | null>;
}

/**
 * Represents a voice that can be used for speech synthesis.
 */
export interface Voice {
  /** The display name of the voice */
  name: string;
  /** A unique identifier for the voice */
  id: string;
  /** The language code for the voice */
  lang: string;
  /** The provider that owns this voice */
  provider: VoiceProvider;
  /** Optional description of the voice */
  description: string | null;
  /**
   * Create a new utterance with this voice.
   * @param text - The text to speak
   * @returns An utterance that can be started and stopped
   */
  createUtterance(text: string): Utterance;
}

/**
 * Represents a speech utterance that can be controlled.
 */
export interface Utterance {
  /** Start speaking the utterance */
  start(): void;
  /** Stop speaking the utterance */
  stop(): void;
  /** Set the callback for when the utterance starts speaking */
  set onstart(callback: () => void);
  /** Set the callback for when the utterance finishes speaking */
  set onend(callback: () => void);
}

/**
 * Get the appropriate voice provider based on available API keys.
 * @param options - Configuration options for the voice provider
 * @param options.elevenLabsApiKey - API key for Eleven Labs (if available)
 * @param options.cacheMaxAge - Maximum age of cached responses in seconds (default: 1 hour)
 * @returns A voice provider instance
 */
export function getVoiceProvider(options: {
  elevenLabsApiKey?: string | null;
  cacheMaxAge?: number;
}): VoiceProvider {
  if (options.elevenLabsApiKey) {
    return createElevenLabsVoiceProvider(
      options.elevenLabsApiKey,
      ELEVEN_LABS_BASE_URL,
      {
        cacheMaxAge: options.cacheMaxAge,
      },
    );
  }
  return browserVoiceProvider;
}
