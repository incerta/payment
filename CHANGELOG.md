# 2026-06-12T01:04:35+02:00

[zed agent: gpt-5.3-codex]

### What changed

- Moved version-specific middleware to global layer:
  - `src/api/v1/middleware/webhook-auth/webhook-auth.middleware.ts` → `src/middleware/webhook-auth/webhook-auth.middleware.ts`
  - Updated wiring in `src/loaders/routes.ts`

- Replaced route `types/parsers` with DTO schemas:
  - Added:
    - `src/api/v1/dto/invoice/invoice.dto.ts`
    - `src/api/v1/dto/webhook/webhook.dto.ts`
  - Removed:
    - `src/api/v1/routes/invoice/invoice.types.ts`
    - `src/api/v1/routes/invoice/invoice.parsers.ts`
    - `src/api/v1/routes/webhook/webhook.types.ts`
    - `src/api/v1/routes/webhook/webhook.parsers.ts`

- DTOs now use **Zod** and include constraints/range limiters per property (length/regex/numeric bounds).

- Controllers now parse input via DTO schemas and validate output contracts in dev/CI:
  - `src/api/v1/controllers/invoice/invoice.controller.ts`
  - `src/api/v1/controllers/webhook/webhook.controller.ts`
  - via new helper: `src/core/route-deprecate-middleware.ts`
  - validation is enabled only when `NODE_ENV !== 'production'`.

- Updated mapper DTO imports:
  - `src/api/v1/controllers/invoice/invoice.create.mappers.ts`
  - `src/api/v1/controllers/invoice/invoice.get.mappers.ts`
  - `src/api/v1/controllers/webhook/webhook.process.mappers.ts`

- Removed obsolete core alias types:
  - `src/core/controller.type.ts`
  - `src/core/middleware.type.ts`
  - `src/core/route.type.ts`
  - `src/core/repository.type.ts`
  - routes/middleware now use `express` `RequestHandler` directly.

- Added test for dev-only response validation behavior:
  - `src/core/__tests__/route-deprecate-middleware.test.ts`

- Updated docs:
  - `README.md` structure/architecture section

- Added dependency:
  - `zod` in `package.json` / `package-lock.json`
