# FastAPI Rules

## Project Structure

```text
api/
  src/
    main.py       -> FastAPI application entrypoint
  tests/
    test_main.py  -> API tests
  pyproject.toml  -> API dependencies and tool config
```

## Routing

- Define routes in `api/src/main.py` or dedicated router modules
- Use `APIRouter` for grouping related endpoints
- Use path operation decorators: `@app.get()`, `@app.post()`, etc.
- Always specify response model types

## Models

- Use Pydantic `BaseModel` for request/response schemas
- Place shared models in `api/src/models.py`
- Use `Field()` for validation constraints and descriptions
- Prefer `Annotated` types for dependency injection

## Dependencies

- Use FastAPI's `Depends()` for dependency injection
- Define reusable dependencies as functions or classes
- Use `Annotated` type aliases for common dependencies

## Testing

- Use `httpx.AsyncClient` with `ASGITransport` for API tests
- Mark async tests with `@pytest.mark.anyio`
- Test both success and error response codes
- Run tests: `cd api && uv run pytest`

## Commands

```bash
cd api && uv run uvicorn src.main:app --reload --port 8000  # Dev server
cd api && uv run pytest                                      # Run tests
cd api && ruff check . && ruff format --check .              # Lint
cd api && uv run mypy .                                      # Type check
```
