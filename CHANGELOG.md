# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Fixed memory leak in `ElevenLabsUtterance` by properly revoking object URLs
- Fixed API example code using incorrect parameter name (`elevenLabs` -> `elevenLabsApiKey`)
- Added proper error handling for ElevenLabs API failures
- Changed Zod schema from `.strict()` to `.passthrough()` for forward compatibility with API changes

### Added
- Comprehensive test suite for `ElevenLabsVoiceProvider`
- Test suite for `cachedFetch` utility
- CI workflow for automated testing and linting
- `CHANGELOG.md` to track project changes
- `CONTRIBUTING.md` with contribution guidelines
- Browser compatibility documentation

### Changed
- Extracted cache duration constant to `DEFAULT_CACHE_MAX_AGE` to avoid duplication
- Updated Biome to latest version for improved linting and formatting

### Improved
- Better error messages for API failures
- Resource cleanup on audio playback errors
- Code organization with centralized constants

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

[Unreleased]: https://github.com/osteele/speech-provider/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/osteele/speech-provider/releases/tag/v0.1.1
[0.1.0]: https://github.com/osteele/speech-provider/releases/tag/v0.1.0
