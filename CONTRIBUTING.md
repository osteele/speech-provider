# Contributing to speech-provider

Thank you for your interest in contributing to speech-provider! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please be respectful and constructive in all interactions with the project and its community.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- Git

### Setting Up the Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/speech-provider.git
   cd speech-provider
   ```

3. Install dependencies:
   ```bash
   bun install
   ```

4. Create a new branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running Tests

```bash
bun test
```

### Linting and Formatting

We use [Biome](https://biomejs.dev/) for linting and formatting:

```bash
# Check for linting issues
bun run lint

# Fix linting issues automatically
bun run lint:fix

# Format code
bun run format

# Type checking
bun run typecheck
```

### Building the Project

```bash
bun run build
```

### Running the Documentation Server

```bash
# Build and serve documentation locally
bun run docs:dev
```

## Making Changes

### Code Style

- Follow the existing code style
- Use TypeScript for all code
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Use descriptive variable and function names

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add support for custom voice models
fix: prevent memory leak in audio playback
docs: update README with caching examples
test: add tests for BrowserVoiceProvider
```

### Testing

- Add tests for all new features and bug fixes
- Ensure all tests pass before submitting a PR
- Aim for high test coverage
- Write both unit tests and integration tests where appropriate

### Documentation

- Update the README if you change functionality
- Add JSDoc comments to all public APIs
- Update the CHANGELOG.md with your changes
- Consider adding examples for new features

## Submitting Changes

### Before Submitting a Pull Request

1. Ensure all tests pass: `bun test`
2. Check linting: `bun run lint`
3. Format your code: `bun run format`
4. Type check: `bun run typecheck`
5. Build the project: `bun run build`
6. Update CHANGELOG.md under the `[Unreleased]` section

### Creating a Pull Request

1. Push your changes to your fork
2. Create a pull request from your branch to the main repository
3. Fill out the pull request template with:
   - Clear description of the changes
   - Motivation and context
   - How the changes were tested
   - Screenshots (if applicable)
   - Related issue numbers (if applicable)

4. Wait for review and address any feedback

## Project Structure

```
speech-provider/
├── src/                    # Source code
│   ├── index.ts           # Main entry point
│   ├── VoiceProvider.ts   # Core interfaces
│   ├── BrowserVoiceProvider.ts
│   ├── ElevenLabsVoiceProvider.ts
│   ├── ElevenLabsTypes.ts
│   ├── constants.ts       # Shared constants
│   └── utils/             # Utility functions
├── test/                  # Test files
├── examples/              # Example usage
├── docs/                  # Generated documentation
└── .github/               # GitHub workflows
```

## Development Tips

### Testing with a Real ElevenLabs API Key

1. Set the `ELEVEN_LABS_API_KEY` environment variable
2. Run the example: `bun run examples/eleven_labs.ts`

### Debugging

- Use `console.log()` for simple debugging
- Use the Bun debugger for more complex issues
- Check browser DevTools console for client-side issues

## Getting Help

- Check existing [issues](https://github.com/osteele/speech-provider/issues)
- Create a new issue if you have questions
- Be specific and provide code examples

## License

By contributing to speech-provider, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in the project README and release notes.

Thank you for contributing! 🎉
