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
const provider = getVoiceProvider({ elevenLabsApiKey: 'your-api-key' });

// Use Eleven Labs with custom cache duration
const provider = getVoiceProvider({
  elevenLabsApiKey: 'your-api-key',
  cacheMaxAge: 86400 // Cache for 1 day
});

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
- Automatic caching of Eleven Labs API responses to reduce API calls
- Configurable cache duration for Eleven Labs responses

## API

### `getVoiceProvider(options)`

Creates a voice provider based on the available API keys. Falls back to browser speech synthesis if no API keys are provided.

```typescript
function getVoiceProvider(options: {
  elevenLabsApiKey?: string | null;
  cacheMaxAge?: number; // Cache duration in seconds (default: 1 hour)
}): VoiceProvider;
```

### `createElevenLabsVoiceProvider(apiKey, options?)`

Creates an Eleven Labs voice provider with optional configuration.

```typescript
function createElevenLabsVoiceProvider(
  apiKey: string,
  options?: {
    validateResponses?: boolean;
    printVoiceProperties?: boolean;
    cacheMaxAge?: number; // Cache duration in seconds (default: 1 hour)
  }
): VoiceProvider;
```

### Caching

The library implements automatic caching for Eleven Labs API responses:

- Browser voices are cached automatically by the browser's speech synthesis engine
- Eleven Labs responses are cached using IndexedDB with a default duration of 1 hour
- Cache duration can be configured when creating the provider
- Cached responses are automatically invalidated after the specified duration
- Cache can be disabled by setting `cacheMaxAge: null` in the provider options

Examples of cache configuration:
```typescript
// Use default 1-hour cache
const provider = getVoiceProvider({ elevenLabsApiKey: 'your-api-key' });

// Cache for 1 day
const provider = getVoiceProvider({
  elevenLabsApiKey: 'your-api-key',
  cacheMaxAge: 86400 // 24 hours in seconds
});

// Cache for 1 week
const provider = getVoiceProvider({
  elevenLabsApiKey: 'your-api-key',
  cacheMaxAge: 604800 // 7 days in seconds
});

// Disable caching (preferred approach)
const provider = getVoiceProvider({
  elevenLabsApiKey: 'your-api-key',
  cacheMaxAge: null
});

// Alternative way to disable caching
const provider = getVoiceProvider({
  elevenLabsApiKey: 'your-api-key',
  cacheMaxAge: 0
});
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

Available under the MIT License
