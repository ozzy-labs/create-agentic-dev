# Batch/Worker Rules

## Project Structure

```text
worker/
  src/
    index.ts      -> Worker entrypoint
    processor.ts  -> Job processing logic
  tests/
    processor.test.ts -> Processor tests
  package.json    -> Worker dependencies and scripts
  tsconfig.json   -> Worker TypeScript config
```

## Job Processing

- Define job types with explicit interfaces (`Job`, `JobResult`)
- Keep the entrypoint (`index.ts`) minimal — delegate to processor modules
- Use async/await for all I/O operations
- Exit with non-zero code on failure (`process.exit(1)`)

## Testing

- Test processor functions in isolation (no side effects)
- Mock external services (queues, databases) in tests
- Run tests: `cd worker && pnpm test`

## Commands

```bash
cd worker && pnpm run dev      # Dev mode (tsx watch)
cd worker && pnpm test         # Run tests (vitest)
cd worker && pnpm run build    # Build (tsdown)
cd worker && tsc --noEmit      # Type check
```
