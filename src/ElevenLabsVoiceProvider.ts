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

const ELEVEN_LABS_BASE_URL = "https://api.elevenlabs.io/v1";

class ElevenLabsVoiceProvider implements VoiceProvider {
  name = "ElevenLabs";

  private apiKey: string;
  private baseUrl: string;
  private validateResponses: boolean;
  private printVoiceProperties: boolean;

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

  async getDefaultVoice({ lang }: { lang: string }): Promise<Voice | null> {
    const voices = await this.getVoices({ lang, minVoices: 1 });
    return voices[0] ?? null;
  }
}

class ElevenLabsVoice implements Voice {
  constructor(
    private apiKey: string,
    private voiceData: ElevenLabsVoiceData,
    public provider: VoiceProvider,
  ) {}

  get lang() {
    return this.voiceData.labels.language;
  }

  get name() {
    return this.voiceData.name ?? this.voiceData.voice_id;
  }

  get id() {
    return this.voiceData.voice_id;
  }

  get description() {
    const match = / - (.+)/.exec(this.voiceData.description ?? "");
    return match?.[1] ?? null;
  }

  get longDescription() {
    return this.voiceData.description;
  }

  createUtterance(text: string): Utterance {
    return new ElevenLabsUtterance(
      this.apiKey,
      this.voiceData.voice_id,
      this.voiceData.labels.language,
      text,
    );
  }
}

class ElevenLabsUtterance implements Utterance {
  private audio: HTMLAudioElement | null = null;
  private onStartCallback: (() => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor(
    private apiKey: string,
    private voiceId: string,
    private languageCode: string,
    private text: string,
  ) {}

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

  stop() {
    this.audio?.pause();
    this.audio = null;
  }

  set onstart(callback: () => void) {
    this.onStartCallback = callback;
  }

  set onend(callback: () => void) {
    this.onEndCallback = callback;
  }
}

export const createElevenLabsVoiceProvider = (
  apiKey: string,
  options?: { validateResponses?: boolean; printVoiceProperties?: boolean },
) => new ElevenLabsVoiceProvider(apiKey, ELEVEN_LABS_BASE_URL, options);
