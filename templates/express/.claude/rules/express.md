# Express Rules

## Project Structure

```text
api/
  src/
    app.ts        -> Express application definition
    index.ts      -> Server entrypoint (app.listen)
  tests/
    app.test.ts   -> API tests (supertest)
  package.json    -> API dependencies and scripts
  tsconfig.json   -> API TypeScript config
```

## Routing

- Define the Express app in `api/src/app.ts`, server startup in `api/src/index.ts`
- Use `express.Router()` for grouping related endpoints
- Export the `app` instance for testing (do not call `app.listen()` in app.ts)

## Middleware

- Register middleware with `app.use()` in `api/src/app.ts`
- Use `express.json()` for JSON body parsing
- Place error-handling middleware last (4 parameters: `err, req, res, next`)

## Testing

- Use `supertest` to test HTTP endpoints without starting the server
- Import the `app` from `api/src/app.ts` (not `index.ts`)
- Test both success and error response codes
- Run tests: `cd api && pnpm test`

## Commands

```bash
cd api && pnpm run dev      # Dev server (tsx watch, port 3000)
cd api && pnpm test         # Run tests (vitest)
cd api && pnpm run build    # Build (tsdown)
cd api && tsc --noEmit      # Type check
```
