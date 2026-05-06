# Legacy Package: `@ozzylabs/create-agentic-dev`

This repository was previously published under the name [`@ozzylabs/create-agentic-dev`](https://www.npmjs.com/package/@ozzylabs/create-agentic-dev). It has been renamed to [`@ozzylabs/create-agentic-app`](https://www.npmjs.com/package/@ozzylabs/create-agentic-app).

## `legacy-stub/`

The [`legacy-stub/`](../legacy-stub/) directory contains the source for the **end-of-life tombstone release** (`@ozzylabs/create-agentic-dev@1.0.0`) that was published to npm to redirect users to the new package.

When invoked, the published `1.0.0` prints a migration notice and exits with a non-zero status:

```text
$ npx @ozzylabs/create-agentic-dev
  ⚠️  @ozzylabs/create-agentic-dev has been renamed.
      Please use the new package:
        npx @ozzylabs/create-agentic-app
```

### Do not modify `legacy-stub/` casually

This is a one-shot tombstone. The contents are kept in version control purely as an audit trail and a recovery path in case a follow-up patch (e.g. updated migration message, URL fix) is ever needed.

If you do need to publish a follow-up:

1. Bump `legacy-stub/package.json` version to `1.0.x` (patch).
2. From the `legacy-stub/` directory, run `npm publish` while logged in as a user with publish access to `@ozzylabs/create-agentic-dev` (Trusted Publishers are intentionally disabled for this package; manual publish only).
3. Apply or refresh the deprecation notice:

   ```bash
   npm deprecate @ozzylabs/create-agentic-dev@"*" \
     "Renamed to @ozzylabs/create-agentic-app. Run: npx @ozzylabs/create-agentic-app"
   ```

The `legacy-stub/` directory is intentionally isolated from the main project's build, lint, type-check, and test pipelines. Do not add it to `tsconfig.json`, `biome.json`, `vitest.config.ts`, or `release-please-config.json`.
