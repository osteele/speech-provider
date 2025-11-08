/**
 * Main entry point for the speech-provider library.
 * This module exports the core interfaces and implementations for text-to-speech functionality.
 * It provides a unified interface for both browser-based speech synthesis and ElevenLabs voices.
 *
 * @example
 * ```typescript
 * import { getVoiceProvider } from 'speech-provider';
 *
 * // Use browser voices only
 * const provider = getVoiceProvider({});
 *
 * // Use Eleven Labs voices if API key is available
 * const provider = getVoiceProvider({ elevenLabsApiKey: 'your-api-key' });
 *
 * // Get voices for a specific language
 * const voices = await provider.getVoices({ lang: 'en-US', minVoices: 1 });
 *
 * // Create and play an utterance
 * if (voices.length > 0) {
 *   const utterance = voices[0].createUtterance('Hello, world!');
 *   utterance.start();
 * }
 * ```
 *
 * @packageDocumentation
 */

// Export browser voice provider
export {
  BrowserSpeechSynthesisVoice,
  BrowserVoiceProvider,
  browserVoiceProvider,
} from "./BrowserVoiceProvider";
export type { ElevenLabsVoiceData } from "./ElevenLabsTypes";
// Export ElevenLabs voice provider
export {
  createElevenLabsVoiceProvider,
  ElevenLabsUtterance,
  ElevenLabsVoice,
  ElevenLabsVoiceProvider,
} from "./ElevenLabsVoiceProvider";
export type { Utterance, Voice, VoiceProvider } from "./VoiceProvider";
// Export main interfaces and functions
export { getVoiceProvider } from "./VoiceProvider";
