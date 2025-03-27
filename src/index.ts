// Export main interfaces and functions
export {
  VoiceProvider,
  Voice,
  Utterance,
  getVoiceProvider,
} from "./VoiceProvider";

// Export browser voice provider
export {
  BrowserVoiceProvider,
  browserVoiceProvider,
  BrowserSpeechSynthesisVoice,
} from "./BrowserVoiceProvider";

// Export ElevenLabs voice provider
export { createElevenLabsVoiceProvider } from "./ElevenLabsVoiceProvider";
export { ElevenLabsVoiceData } from "./ElevenLabsTypes";
