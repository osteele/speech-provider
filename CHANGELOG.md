# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2026-08-09

### Changed

- Replaced the older ElevenLabs Turbo v2.5 synthesis model with the recommended
  Flash v2.5 model for lower latency and equivalent language coverage.

## [0.2.0] - 2026-08-09

### Fixed

- Release object URLs and audio resources after playback.
- Report synthesis and playback failures through rejected promises and `onerror`.
- Accept the current ElevenLabs v2 voice-list response and future response fields.
- Avoid exposing API keys and utterance text in cache keys.
- Handle browser voice loading after server-side rendering.

### Added

- Cancellable asynchronous utterance playback.
- BCP-47 language matching and explicit cross-language fallback.
- An interactive browser and ElevenLabs demo.
- Package-install smoke tests and CI coverage for supported Node versions.

### Changed

- `Utterance.start()` and `Utterance.stop()` now return promises.
- ElevenLabs responses use the Cache API with hashed identifiers.
- Unrelated-language voices are excluded unless `fallbackToAnyLanguage` is set.
- Updated Biome and expanded package documentation.

## [0.1.1] - 2025-01-XX

### Added
- Response caching for ElevenLabs API
- Configurable cache duration

### Changed
- Improved type exports and dependency classification
- Enhanced BrowserVoiceProvider to handle asynchronous voice loading

## [0.1.0] - 2025-01-XX

### Added
- Initial release
- Unified interface for browser speech synthesis and ElevenLabs voices
- TypeScript support with strict typing
- Automatic fallback to browser voices
- Event listeners for speech events
- Documentation with TypeDoc

[Unreleased]: https://github.com/osteele/speech-provider/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/osteele/speech-provider/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/osteele/speech-provider/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/osteele/speech-provider/releases/tag/v0.1.1
[0.1.0]: https://github.com/osteele/speech-provider/releases/tag/v0.1.0
