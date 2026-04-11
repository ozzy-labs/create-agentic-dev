# Hono Rules

## Project Structure

```text
api/
  src/
    app.ts        -> Hono application definition
    index.ts      -> Server entrypoint (@hono/node-server)
  tests/
    app.test.ts   -> API tests (app.request)
  package.json    -> API dependencies and scripts
  tsconfig.json   -> API TypeScript config
```

## Routing

- Define the Hono app in `api/src/app.ts`, server startup in `api/src/index.ts`
- Use `app.route()` for grouping related endpoints
- Export the `app` instance for testing (do not start the server in app.ts)

## Middleware

- Register middleware with `app.use()` in `api/src/app.ts`
- Use built-in middleware from `hono/middleware` (e.g., `cors()`, `logger()`)
- Error handling: use `app.onError()` for global error handling

## Testing

- Use `app.request()` to test HTTP endpoints without starting the server
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
