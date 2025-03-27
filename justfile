default:
    @just --list

# Format code using biome
format:
    bun run format

# Run linting
lint:
    bun run lint

# Run type checking
typecheck:
    bun run typecheck

# Run all checks
check: lint typecheck test

# Fix common lint errors
fix: format
    bun run lint:fix

# Run tests
test:
    bun test

# Generate API documentation
docs:
    bun run docs
