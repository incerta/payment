# App structure

The app uses strict boundary layering with a single source of truth for HTTP behavior.

**Hierarchy (strict):** `contract <- route <- controller <- service <- model`

API (`/api/v1`) is the HTTP boundary.

- **Contracts** (`src/api/v1/contracts`) – top-level HTTP contract entity (request/response/error schemas + operation metadata)
- **Routes** – bind contract validators, middleware and controllers to paths
- **DTO** (`src/api/v1/dto`) – reusable Zod schema primitives for contracts/controllers mapping
- **Controllers** – orchestration only: call services, map domain to response payload
- **Middleware** (`src/middleware`) – authentication & security, independent from API versioning
- **Services** – business logic
- **Models** – persistence

> Import direction is strict: `contract <- route <- controller <- service <- model`; middleware is attached at route level.

Validation is route-level only:

- Request validation (`body/params/query`) is executed by contract-driven route validators.
- Response validation is executed by contract-driven route validator middleware and enabled only when `NODE_ENV !== 'production'`.

Swagger UI is served at `/docs`, raw OpenAPI JSON at `/openapi.json`.

```
|-- src
|   |-- api
|   |   |-- v1
|   |   |   |-- contracts
|   |   |   |   |-- <contract_name>
|   |   |   |   |   |-- <contract_name>.contract.ts
|   |   |   |-- routes
|   |   |   |   |-- <route_name>
|   |   |   |   |   |-- <route_name>.route.ts
|   |   |   |-- dto
|   |   |   |   |-- <route_name>
|   |   |   |   |   |-- <route_name>.dto.ts
|   |   |   |-- controllers
|   |   |   |   |-- <controller_name>
|   |   |   |   |   |-- <controller_name>.controller.ts
|   |   |   |   |   |-- <controller_name>.<?action>.mappers.ts
|   |-- middleware
|   |   |-- <middleware_name>
|   |   |   |-- <middleware_name>.middleware.ts
|   |-- services
|   |   |-- <service_name>
|   |   |   |-- <service_name>.service.ts
|   |-- models
|   |   |-- <service_name>
|   |   |   |-- <service_name>.service.ts
|   |-- core
|   |   |-- error.ts
|   |   |-- http-contract.ts
|   |-- loaders
|   |-- utils
|   |-- config.ts
|   |-- app.ts
|   |-- server.ts
```

# Setup, run, test

Prerequisites

```sh
npm install
cp .env.example .env
docker-compose up -d # or configure your own MongoDB and Redis based on env
```

Run dev server

```sh
npm run dev
```

Production build

```bash
npm run build
npm start
```

Test

```sh
npm run test:unit
npm run test:integration
```

Generate OpenAPI spec

```sh
npm run docs:openapi:generate
```

## API version (`/v1`, `/v2`, ...)

Bumped only on a **public contract break** — any change that can cause a compliant client to fail:

- Request/response shape changes
- New, removed, or renamed fields
- HTTP status or error shape changes
- Behavior changes relative to documented contract

Additive changes (new optional fields, new endpoints) and bug fixes that align implementation with existing documentation are **not** a version bump.

Non-compliant clients — those coupled to undocumented or incorrect behavior — have no claim on stability. Favoring them is an explicit, documented exception, not a default.

Re-exports from previous versions are not allowed. New API version release
not require to have capabilities of the previous API version.

## Module version (`major.minor.patch`)

Follows semver independently of the API version, at a finer granularity after first major release:

| Segment | Trigger                                                          |
| ------- | ---------------------------------------------------------------- |
| Major   | Public contract break — always in sync with an API version bump  |
| Minor   | Additive changes, doc/impl corrections, new optional fields      |
| Patch   | Internal fixes, performance, refactors with no observable change |

Major module version and API version must stay in sync. If they diverge, the mapping between a deployed API version and a codebase version is lost.

## When is the first major 1.0.0 version of the module going to be released?

When the module launches on production. Until then, all changes must not be considered as breaking.
