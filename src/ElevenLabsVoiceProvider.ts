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

/** The base URL for the Eleven Labs API */
export const ELEVEN_LABS_BASE_URL = "https://api.elevenlabs.io/v1";

/**
 * A voice provider that uses the ElevenLabs API for high-quality text-to-speech.
 * This provider requires an API key from ElevenLabs.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const provider = createElevenLabsVoiceProvider("your-api-key");
 * const voices = await provider.getVoices({ lang: "en-US", minVoices: 1 });
 * const voice = voices[0];
 * const utterance = voice.createUtterance("Hello, world!");
 * utterance.start();
 *
 * // With volume normalization enabled
 * const providerWithNormalization = createElevenLabsVoiceProvider("your-api-key", undefined, {
 *   normalizeVolume: true
 * });
 * const voices = await providerWithNormalization.getVoices({ lang: "en-US", minVoices: 1 });
 * const voice = voices[0];
 * const utterance = voice.createUtterance("Hello, world!");
 * utterance.start(); // Audio will be played with normalized volume
 * ```
 */
export class ElevenLabsVoiceProvider implements VoiceProvider {
  name = "ElevenLabs";

  private baseUrl: string;
  private validateResponses: boolean;
  private printVoiceProperties: boolean;
  readonly cacheMaxAge: number | null; // Make it public and readonly
  private _normalizeVolume: boolean;

  // Public API key for use by voices
  readonly apiKey: string;

  /**
   * Get the current volume normalization setting
   */
  get normalizeVolume(): boolean {
    return this._normalizeVolume;
  }

  /**
   * Set the volume normalization setting
   * @param value - Whether to normalize audio volume
   */
  set normalizeVolume(value: boolean) {
    this._normalizeVolume = value;
  }

  /**
   * Create a new ElevenLabs voice provider.
   * @param apiKey - Your ElevenLabs API key
   * @param baseUrl - The base URL for the ElevenLabs API (defaults to the official API)
   * @param options - Additional options for the provider
   * @param options.validateResponses - Whether to validate API responses against the schema
   * @param options.printVoiceProperties - Whether to print voice properties for debugging
   * @param options.cacheMaxAge - Maximum age of cached responses in seconds (default: 1 hour). Set to null to disable caching.
   * @param options.normalizeVolume - Whether to automatically normalize audio volume during playback (default: false)
   */
  constructor(
    apiKey: string,
    baseUrl: string = ELEVEN_LABS_BASE_URL,
    options: {
      validateResponses?: boolean;
      printVoiceProperties?: boolean;
      cacheMaxAge?: number | null;
      normalizeVolume?: boolean;
    } = {},
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.validateResponses = options.validateResponses || false;
    this.printVoiceProperties = options.printVoiceProperties || false;
    this.cacheMaxAge = options.cacheMaxAge ?? 3600; // Default to 1 hour, null to disable
    this._normalizeVolume = options.normalizeVolume ?? false;
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

    if (!response.ok) {
      throw new Error(
        `Failed to fetch voices: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Check if the response has the expected format
    if (!data || !Array.isArray(data.voices)) {
      throw new Error("Invalid response format from Eleven Labs API");
    }

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

    // Filter voices by language, with additional safety checks for missing properties
    const voices = data.voices.filter(
      (voice: ElevenLabsVoiceData) =>
        voice.labels && voice.labels.language === lang.slice(0, 2),
    );

    return (voices.length >= minVoices ? voices : data.voices).map(
      (voice: ElevenLabsVoiceData) => new ElevenLabsVoice(voice, this),
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
    private voiceData: ElevenLabsVoiceData,
    public provider: ElevenLabsVoiceProvider,
  ) {}

  /**
   * Get the API key from the provider
   */
  get apiKey(): string {
    return this.provider.apiKey;
  }

  /**
   * Get the current volume normalization setting from the provider
   */
  get normalizeVolume(): boolean {
    return this.provider.normalizeVolume;
  }

  /**
   * Get the cache max age from the provider
   */
  get cacheMaxAge(): number | null {
    return this.provider.cacheMaxAge;
  }

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
      this.cacheMaxAge,
      { normalizeVolume: this.normalizeVolume },
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
  private cacheMaxAge: number | null;
  private normalizeVolume: boolean;
  private audioContext: AudioContext | null = null;

  constructor(
    private apiKey: string,
    private voiceId: string,
    private languageCode: string,
    private text: string,
    cacheMaxAge: number | null = 3600, // Default to 1 hour, null to disable
    options: {
      normalizeVolume?: boolean;
    } = {},
  ) {
    this.cacheMaxAge = cacheMaxAge;
    this.normalizeVolume = options.normalizeVolume ?? false;
  }

  /**
   * Start speaking the utterance by fetching audio from ElevenLabs and playing it.
   * If normalizeVolume is enabled, the audio will be processed to normalize its volume.
   */
  async start() {
    const response = await cachedFetch(
      `${ELEVEN_LABS_BASE_URL}/text-to-speech/${this.voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_id: "eleven_turbo_v2_5",
          language_code: this.languageCode,
          text: this.text,
        }),
        cacheOptions: {
          maxAge: this.cacheMaxAge,
        },
      },
    );

    const audioBlob = await response.blob();

    if (this.normalizeVolume) {
      await this.playNormalizedAudio(audioBlob);
    } else {
      const audioUrl = URL.createObjectURL(audioBlob);
      this.audio = new Audio(audioUrl);
      this.audio.onplay = () => this.onStartCallback?.();
      this.audio.onended = () => this.onEndCallback?.();
      await this.audio.play();
    }
  }

  /**
   * Normalize the audio buffer to a consistent volume level
   * @param buffer - The audio buffer to normalize
   * @returns A new audio buffer with normalized volume
   */
  private normalizeAudioBuffer(buffer: AudioBuffer): AudioBuffer {
    // Target RMS level (root mean square) - standard level for normalization
    const TARGET_RMS = 0.2;

    // We need to make sure audioContext exists
    if (!this.audioContext) {
      throw new Error("AudioContext not initialized");
    }
    // Create a new buffer with the same parameters
    const normalizedBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate,
    );

    // Process each channel
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      // Get the audio data
      const inputData = buffer.getChannelData(channel);
      const outputData = normalizedBuffer.getChannelData(channel);

      // Calculate the current RMS (root mean square)
      let sumOfSquares = 0;
      for (let i = 0; i < inputData.length; i++) {
        sumOfSquares += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sumOfSquares / inputData.length);

      // Calculate the gain to apply
      const gain = rms > 0 ? TARGET_RMS / rms : 1;

      // Apply normalization with peak limiting to avoid clipping
      for (let i = 0; i < inputData.length; i++) {
        // Apply gain with soft limiting to prevent clipping
        let sample = inputData[i] * gain;

        // Soft limiter formula to gently limit peaks
        if (sample > 0.8) {
          sample = 0.8 + (1 - 0.8) * Math.tanh((sample - 0.8) / (1 - 0.8));
        } else if (sample < -0.8) {
          sample = -0.8 - (1 - 0.8) * Math.tanh((-sample - 0.8) / (1 - 0.8));
        }

        outputData[i] = sample;
      }
    }

    // Now we know normalizedBuffer is defined
    return normalizedBuffer;
  }

  /**
   * Process and play the audio with normalized volume using Web Audio API
   * @param audioBlob - The audio blob from the API response
   */
  private async playNormalizedAudio(audioBlob: Blob) {
    // Create AudioContext
    this.audioContext = new AudioContext();

    // Convert blob to ArrayBuffer
    const arrayBuffer = await audioBlob.arrayBuffer();

    // Decode the audio data
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    // Create audio source
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;

    // More aggressive volume normalization approach

    // First normalize the audio data to adjust overall volume
    const normalizedBuffer = this.normalizeAudioBuffer(audioBuffer);
    source.buffer = normalizedBuffer;

    // Apply dynamics compression for further volume control
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.value = -50; // Lower threshold to catch more of the audio
    compressor.knee.value = 40; // Wider knee for smoother transition
    compressor.ratio.value = 20; // More aggressive compression ratio
    compressor.attack.value = 0.001; // Faster attack time
    compressor.release.value = 0.5; // Longer release

    // Add a limiter to prevent clipping
    const limiter = this.audioContext.createDynamicsCompressor();
    limiter.threshold.value = -1.0;
    limiter.knee.value = 0.0;
    limiter.ratio.value = 20.0;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.01;

    // Add gain node for final volume level
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0.9; // Slightly below maximum to prevent distortion

    // Connect the audio processing chain
    source.connect(compressor);
    compressor.connect(limiter);
    limiter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Set up callbacks
    source.onended = () => {
      this.onEndCallback?.();
      this.audioContext?.close();
      this.audioContext = null;
    };

    // Start playback
    source.start();
    this.onStartCallback?.();
  }

  /** Stop speaking the utterance */
  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
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
 * Create a new Eleven Labs voice provider.
 * @param apiKey - Your Eleven Labs API key
 * @param baseUrl - The base URL for the Eleven Labs API (defaults to the official API)
 * @param options - Additional options for the provider
 * @param options.validateResponses - Whether to validate API responses against the schema
 * @param options.printVoiceProperties - Whether to print voice properties for debugging
 * @param options.cacheMaxAge - Maximum age of cached responses in seconds (default: 1 hour). Set to null to disable caching.
 * @param options.normalizeVolume - Whether to automatically normalize audio volume during playback (default: false)
 */
export function createElevenLabsVoiceProvider(
  apiKey: string,
  baseUrl: string = ELEVEN_LABS_BASE_URL,
  options: {
    validateResponses?: boolean;
    printVoiceProperties?: boolean;
    cacheMaxAge?: number | null;
    normalizeVolume?: boolean;
  } = {},
): VoiceProvider {
  return new ElevenLabsVoiceProvider(apiKey, baseUrl, options);
}
