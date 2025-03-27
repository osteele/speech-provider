import {
  ElevenLabsVoiceData,
  ElevenLabsVoiceDataSchema,
} from "./ElevenLabsTypes";
import { Utterance, Voice, VoiceProvider } from "./VoiceProvider";
import { cachedFetch } from "./utils/cachedFetch";
import {
  checkObjectsAgainstSchema,
  printDistinctPropertyValues,
} from "./utils/debugging";

/** The base URL for the ElevenLabs API */
const ELEVEN_LABS_BASE_URL = "https://api.elevenlabs.io/v1";

/**
 * A voice provider that uses the ElevenLabs API for high-quality text-to-speech.
 * This provider requires an API key from ElevenLabs.
 *
 * @example
 * ```typescript
 * const provider = createElevenLabsVoiceProvider("your-api-key");
 * const voices = await provider.getVoices({ lang: "en-US", minVoices: 1 });
 * const voice = voices[0];
 * const utterance = voice.createUtterance("Hello, world!");
 * utterance.start();
 * ```
 */
export class ElevenLabsVoiceProvider implements VoiceProvider {
  name = "ElevenLabs";

  private apiKey: string;
  private baseUrl: string;
  private validateResponses: boolean;
  private printVoiceProperties: boolean;

  /**
   * Create a new ElevenLabs voice provider.
   * @param apiKey - Your ElevenLabs API key
   * @param baseUrl - The base URL for the ElevenLabs API (defaults to the official API)
   * @param options - Additional options for the provider
   * @param options.validateResponses - Whether to validate API responses against the schema
   * @param options.printVoiceProperties - Whether to print voice properties for debugging
   */
  constructor(
    apiKey: string,
    baseUrl: string = ELEVEN_LABS_BASE_URL,
    options: {
      validateResponses?: boolean;
      printVoiceProperties?: boolean;
    } = {},
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.validateResponses = options.validateResponses || false;
    this.printVoiceProperties = options.printVoiceProperties || false;
  }

  /**
   * Get available voices for a given language code.
   * @param options - The options for getting voices
   * @param options.lang - The language code to match (e.g., "en-US")
   * @param options.minVoices - The minimum number of voices to return
   * @returns A promise that resolves to an array of ElevenLabs voices
   */
  async getVoices({
    lang,
    minVoices,
  }: {
    lang: string;
    minVoices: number;
  }): Promise<Voice[]> {
    const langCode = lang.slice(0, 2);
    const response = await fetch(
      `${this.baseUrl}/voices?language=${langCode}`,
      {
        headers: { "xi-api-key": this.apiKey },
      },
    );

    const data = (await response.json()) as { voices: ElevenLabsVoiceData[] };

    if (this.validateResponses) {
      checkObjectsAgainstSchema(data.voices, ElevenLabsVoiceDataSchema);
    }

    if (this.printVoiceProperties) {
      printDistinctPropertyValues(
        data.voices as unknown as Record<string, unknown>[],
        {
          omit: [
            "name",
            "voice_id",
            "sharing",
            "voice_verification",
            "fine_tuning",
          ],
        },
      );
    }

    const voices = data.voices.filter(
      (voice) => voice.labels.language === lang.slice(0, 2),
    );

    return (voices.length >= minVoices ? voices : data.voices).map(
      (voice) => new ElevenLabsVoice(this.apiKey, voice, this),
    );
  }

  /**
   * Get the default voice for a given language code.
   * @param options - The options for getting the default voice
   * @param options.lang - The language code to match (e.g., "en-US")
   * @returns A promise that resolves to the first available voice or null if none is available
   */
  async getDefaultVoice({ lang }: { lang: string }): Promise<Voice | null> {
    const voices = await this.getVoices({ lang, minVoices: 1 });
    return voices[0] ?? null;
  }
}

/**
 * A voice implementation that wraps an ElevenLabs voice.
 */
export class ElevenLabsVoice implements Voice {
  constructor(
    private apiKey: string,
    private voiceData: ElevenLabsVoiceData,
    public provider: VoiceProvider,
  ) {}

  /** The language code for the voice */
  get lang() {
    return this.voiceData.labels.language;
  }

  /** The display name of the voice */
  get name() {
    return this.voiceData.name ?? this.voiceData.voice_id;
  }

  /** The unique identifier for the voice */
  get id() {
    return this.voiceData.voice_id;
  }

  /** A short description of the voice */
  get description() {
    const match = / - (.+)/.exec(this.voiceData.description ?? "");
    return match?.[1] ?? null;
  }

  /** The full description of the voice */
  get longDescription() {
    return this.voiceData.description;
  }

  /**
   * Create a new utterance with this voice.
   * @param text - The text to speak
   * @returns A new utterance that can be started and stopped
   */
  createUtterance(text: string): Utterance {
    return new ElevenLabsUtterance(
      this.apiKey,
      this.voiceData.voice_id,
      this.voiceData.labels.language,
      text,
    );
  }
}

/**
 * An utterance implementation that uses the ElevenLabs API to synthesize speech.
 */
export class ElevenLabsUtterance implements Utterance {
  private audio: HTMLAudioElement | null = null;
  private onStartCallback: (() => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor(
    private apiKey: string,
    private voiceId: string,
    private languageCode: string,
    private text: string,
  ) {}

  /**
   * Start speaking the utterance by fetching audio from ElevenLabs and playing it.
   */
  async start() {
    const response = await cachedFetch(
      `${ELEVEN_LABS_BASE_URL}/text-to-speech/${this.voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
          "Cache-Control": "max-age=604800", // one week
        },
        body: JSON.stringify({
          model_id: "eleven_turbo_v2_5",
          language_code: this.languageCode,
          text: this.text,
        }),
      },
    );

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    this.audio = new Audio(audioUrl);

    this.audio.onplay = () => this.onStartCallback?.();
    this.audio.onended = () => this.onEndCallback?.();

    await this.audio.play();
  }

  /** Stop speaking the utterance */
  stop() {
    this.audio?.pause();
    this.audio = null;
  }

  /** Set the callback for when the utterance starts speaking */
  set onstart(callback: () => void) {
    this.onStartCallback = callback;
  }

  /** Set the callback for when the utterance finishes speaking */
  set onend(callback: () => void) {
    this.onEndCallback = callback;
  }
}

/**
 * Create a new ElevenLabs voice provider.
 * @param apiKey - Your ElevenLabs API key
 * @param options - Additional options for the provider
 * @param options.validateResponses - Whether to validate API responses against the schema
 * @param options.printVoiceProperties - Whether to print voice properties for debugging
 * @returns A new ElevenLabs voice provider instance
 */
export const createElevenLabsVoiceProvider = (
  apiKey: string,
  options?: { validateResponses?: boolean; printVoiceProperties?: boolean },
) => new ElevenLabsVoiceProvider(apiKey, ELEVEN_LABS_BASE_URL, options);
