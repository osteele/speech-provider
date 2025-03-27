# speech-provider

A unified interface for browser speech synthesis and Eleven Labs voices.

## Installation

```bash
# Using npm
npm install speech-provider

# Using yarn
yarn add speech-provider

# Using bun
bun add speech-provider
```

## Documentation

Full API documentation is available at [https://osteele.github.io/speech-provider/](https://osteele.github.io/speech-provider/).

## Usage

```typescript
import { getVoiceProvider } from 'speech-provider';

// Use browser voices only
const provider = getVoiceProvider({});

// Use Eleven Labs voices if API key is available
const provider = getVoiceProvider({ elevenLabs: 'your-api-key' });

// Get voices for a specific language
const voices = await provider.getVoices({ lang: 'en-US', minVoices: 1 });

// Get default voice for a language
const defaultVoice = await provider.getDefaultVoice({ lang: 'en-US' });

// Create and play an utterance
if (defaultVoice) {
  const utterance = defaultVoice.createUtterance('Hello, world!');
  utterance.onstart = () => console.log('Started speaking');
  utterance.onend = () => console.log('Finished speaking');
  utterance.start();
}
```

## Features

- Unified interface for both browser speech synthesis and Eleven Labs voices
- Automatic fallback to browser voices when Eleven Labs API key is not provided
- Typesafe API with TypeScript support
- Simple voice selection by language
- Event listeners for speech start and end events

## API

### `getVoiceProvider(apiKeys)`

Creates a voice provider based on the available API keys. Falls back to browser speech synthesis if no API keys are provided.

```typescript
function getVoiceProvider(apiKeys: { elevenLabs?: string | null }): VoiceProvider;
```

### `VoiceProvider` Interface

```typescript
interface VoiceProvider {
  name: string;
  getVoices({ lang, minVoices }: { lang: string; minVoices: number }): Promise<Voice[]>;
  getDefaultVoice({ lang }: { lang: string }): Promise<Voice | null>;
}
```

### `Voice` Interface

```typescript
interface Voice {
  name: string;
  id: string;
  lang: string;
  provider: VoiceProvider;
  description: string | null;
  createUtterance(text: string): Utterance;
}
```

### `Utterance` Interface

```typescript
interface Utterance {
  start(): void;
  stop(): void;
  set onstart(callback: () => void);
  set onend(callback: () => void);
}
```

## License

Copyright 2025 by Oliver Steele

MIT
