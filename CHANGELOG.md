# 2026-06-12T03:48:34+02:00

[zed agent: gpt-5.3-codex]

### What changed

- Enforced hierarchy and moved validation fully to routes:
  - `contract <- route <- controller <- service <- model`
- Controllers no longer validate input/output:
  - `src/api/v1/controllers/invoice/invoice.controller.ts`
  - `src/api/v1/controllers/webhook/webhook.controller.ts`
- Route-level contract validation now handles:
  - request body/params parsing
  - response schema validation (non-prod)
  - via `src/core/http-contract.ts`
- Migrated all endpoints to contract-driven routing:
  - `POST /invoice` + `GET /invoice/:id` in `src/api/v1/routes/invoice/invoice.route.ts`
  - `POST /webhook` in `src/api/v1/routes/webhook/webhook.route.ts`

### Contracts added/updated

- `src/api/v1/contracts/invoice/create-invoice.contract.ts`
- `src/api/v1/contracts/invoice/get-invoice.contract.ts`
- `src/api/v1/contracts/webhook/process-webhook.contract.ts`
- `src/api/v1/contracts/index.ts`

### Error schemas fixed to match `core/error.ts`

Updated `src/api/v1/contracts/errors.contract.ts` with shapes aligned to actual error codes/classes:

- `ROUTE_ERROR`
- `MIDDLEWARE_ERROR`
- `CONTROLLER_ERROR`
- `SERVICE_ERROR`
- `REPOSITORY_ERROR`
- `INTERNAL_ERROR`

…and endpoint status mappings now reflect real runtime behavior.

### DTO cleanup

Removed parser functions from DTOs (validation is route-only now), kept schema/type definitions:

- `src/api/v1/dto/invoice/invoice.dto.ts`
- `src/api/v1/dto/webhook/webhook.dto.ts`

### README updated

Updated layering/docs and made contract the top HTTP entity:

- `README.md`
  - controller description fixed
  - strict hierarchy documented
  - route-level validation policy documented

### Route layer tests

Added/updated unit tests focused on route wiring + validation:

- `src/api/v1/routes/invoice/__tests__/invoice.route.test.ts`
- `src/api/v1/routes/webhook/__tests__/webhook.route.test.ts`

### OpenAPI/docs

Regenerated spec:

- `storage/docs/openapi.json`
- `/docs` and `/openapi.json` wiring already in place.

# 2026-06-12T02:47:08+02:00

[zed agent: gpt-5.3-codex]

### What changed

- Renamed and expanded core contract helper:
  - `src/core/http-contract.ts`
  - added:
    - `parseRouteInput(...)` (shared Zod -> `RouteError`)
    - `createContractBodyValidator(...)` (route middleware for body validation)
    - kept `validateRouteOutput(...)` (dev/test-only output validation)

- Removed duplicated `mapZodToRouteError` logic:
  - `src/api/v1/dto/invoice/invoice.dto.ts`
  - `src/api/v1/dto/webhook/webhook.dto.ts`
  - both now use `parseRouteInput(...)`

- Added contract-driven route wiring for **POST /invoice**:
  - `src/api/v1/contracts/invoice/create-invoice.contract.ts`
  - `src/api/v1/routes/invoice/invoice.route.ts` uses `createContractBodyValidator(createInvoiceContract)`
  - `src/api/v1/controllers/invoice/invoice.controller.ts` reads validated payload from `res.locals`

- Added OpenAPI/Swagger generation from contract:
  - `src/api/v1/contracts/errors.contract.ts` (documented error shapes)
  - `src/api/v1/contracts/index.ts`
  - `src/loaders/openapi.ts` (serves `/openapi.json` and `/docs`)
  - `scripts/generate-openapi.ts`
  - generated file: `storage/docs/openapi.json`

- App wiring:
  - `src/app.ts` now calls `loadOpenApiDocs(app)`

- Tests:
  - renamed test: `src/core/__tests__/http-contract.test.ts`
  - new route-layer unit tests:
    - `src/api/v1/routes/invoice/__tests__/invoice.route.test.ts`

- Docs/deps:
  - `README.md` updated for contracts + docs endpoints/command
  - `package.json` scripts/deps updated (`docs:openapi:generate`, zod-to-openapi, swagger-ui-express)
  - `package-lock.json` updated

# 2026-06-12T01:04:35+02:00

[zed agent: gpt-5.3-codex]

### What changed

- Enforced hierarchy and moved validation fully to routes:
  - `contract <- route <- controller <- service <- model`
- Controllers no longer validate input/output:
  - `src/api/v1/controllers/invoice/invoice.controller.ts`
  - `src/api/v1/controllers/webhook/webhook.controller.ts`
- Route-level contract validation now handles:
  - request body/params parsing
  - response schema validation (non-prod)
  - via `src/core/http-contract.ts`
- Migrated all endpoints to contract-driven routing:
  - `POST /invoice` + `GET /invoice/:id` in `src/api/v1/routes/invoice/invoice.route.ts`
  - `POST /webhook` in `src/api/v1/routes/webhook/webhook.route.ts`

### Contracts added/updated

- `src/api/v1/contracts/invoice/create-invoice.contract.ts`
- `src/api/v1/contracts/invoice/get-invoice.contract.ts`
- `src/api/v1/contracts/webhook/process-webhook.contract.ts`
- `src/api/v1/contracts/index.ts`

### Error schemas fixed to match `core/error.ts`

Updated `src/api/v1/contracts/errors.contract.ts` with shapes aligned to actual error codes/classes:

- `ROUTE_ERROR`
- `MIDDLEWARE_ERROR`
- `CONTROLLER_ERROR`
- `SERVICE_ERROR`
- `REPOSITORY_ERROR`
- `INTERNAL_ERROR`

…and endpoint status mappings now reflect real runtime behavior.

### DTO cleanup

Removed parser functions from DTOs (validation is route-only now), kept schema/type definitions:

- `src/api/v1/dto/invoice/invoice.dto.ts`
- `src/api/v1/dto/webhook/webhook.dto.ts`

### README updated

Updated layering/docs and made contract the top HTTP entity:

- `README.md`
  - controller description fixed
  - strict hierarchy documented
  - route-level validation policy documented

### Route layer tests

Added/updated unit tests focused on route wiring + validation:

- `src/api/v1/routes/invoice/__tests__/invoice.route.test.ts`
- `src/api/v1/routes/webhook/__tests__/webhook.route.test.ts`

### OpenAPI/docs

Regenerated spec:

- `storage/docs/openapi.json`
- `/docs` and `/openapi.json` wiring already in place.

# 2026-06-12T02:47:08+02:00

[zed agent: gpt-5.3-codex]

### What changed

- Renamed and expanded core contract helper:
  - `src/core/http-contract.ts`
  - added:
    - `parseRouteInput(...)` (shared Zod -> `RouteError`)
    - `createContractBodyValidator(...)` (route middleware for body validation)
    - kept `validateRouteOutput(...)` (dev/test-only output validation)

- Removed duplicated `mapZodToRouteError` logic:
  - `src/api/v1/dto/invoice/invoice.dto.ts`
  - `src/api/v1/dto/webhook/webhook.dto.ts`
  - both now use `parseRouteInput(...)`

- Added contract-driven route wiring for **POST /invoice**:
  - `src/api/v1/contracts/invoice/create-invoice.contract.ts`
  - `src/api/v1/routes/invoice/invoice.route.ts` uses `createContractBodyValidator(createInvoiceContract)`
  - `src/api/v1/controllers/invoice/invoice.controller.ts` reads validated payload from `res.locals`

- Added OpenAPI/Swagger generation from contract:
  - `src/api/v1/contracts/errors.contract.ts` (documented error shapes)
  - `src/api/v1/contracts/index.ts`
  - `src/loaders/openapi.ts` (serves `/openapi.json` and `/docs`)
  - `scripts/generate-openapi.ts`
  - generated file: `storage/docs/openapi.json`

- App wiring:
  - `src/app.ts` now calls `loadOpenApiDocs(app)`

- Tests:
  - renamed test: `src/core/__tests__/http-contract.test.ts`
  - new route-layer unit tests:
    - `src/api/v1/routes/invoice/__tests__/invoice.route.test.ts`

- Docs/deps:
  - `README.md` updated for contracts + docs endpoints/command
  - `package.json` scripts/deps updated (`docs:openapi:generate`, zod-to-openapi, swagger-ui-express)
  - `package-lock.json` updated

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
