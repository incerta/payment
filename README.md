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

# App structure

The app is organized into four layers, each with a single responsibility.
Import direction is strictly top-down — upper layers call lower ones; lower layers never import from above.

API (/api/v1) is the HTTP boundary.

- **Routes** – bind middleware and controllers to paths
- **Middleware** – authentication & security
- **Controllers** – receive parsed requests, call services, map the result into a response DTO
- **Services** – business logic
- **Models** – handle DB persistence/caching

import direction: routes <- middleware | controllers <- services (siblings allowed) <- models

```
|-- dist
|-- src
|   |-- api
|   |   |-- v1
|   |   |   |-- routes
|   |   |   |   |-- <route_name>
|   |   |   |   |   |-- <route_name>.route.ts // Route definition: binds middleware and controller to route
|   |   |   |   |   |-- <route_name>.types.ts // Request/Response DTO's
|   |   |   |   |   |-- <route_name>.parsers.ts // Schema based parser functions
|   |   |   |   |   |-- __tests__ // Wiring tests: correct middleware and controller are bound to each route
|   |   |   |-- middleware
|   |   |   |   |-- <middleware_name>
|   |   |   |   |   |-- <middleware_name>.middleware.ts // Middleware logic: authentication & security
|   |   |   |   |   |-- __tests__ // Unit tests: middleware logic in isolation (mocked req/res)
|   |   |   |-- controllers
|   |   |   |   |-- <controller_name>
|   |   |   |   |   |-- <controller_name>.controller.ts // Controller logic: route handler, calls service, maps DTO's
|   |   |   |   |   |-- <controller_name>.<?action>.mappers.ts // Inbound/outbound data layer transition
|   |   |   |   |   |-- __tests__ // Unit tests: happy path, error cases, status
|   |   |   |-- fixtures // Cross layer fixtures for unit tests
|   |-- services
|   |   |-- <service_name>
|   |   |   |-- <service_name>.service.ts // Service logic: business logic, calls model persistence methods and other services
|   |   |   |-- __tests__ // Unit tests: business logic in isolation (mocked models/external calls)
|   |-- models
|   |   |-- <model_name>
|   |   |   |-- <model_name>.repository.ts // DB model persistence logic
|   |   |   |-- <model_name>.schema.ts // Mongoose schema definition
|   |   |   |-- <model_name>.types.ts // Raw model and repository types
|   |   |   |-- __tests__ // Unit tests: model validation and persistence logic
|   |-- core
|   |   |-- error.ts // classes: BaseError, RouteError, MiddlewareError, ControllerError, ServiceError, RepositoryError
|   |   |-- route.type.ts // must be mountable by the Express router / loader
|   |   |-- middleware.type.ts // must match Express's (req, res, next) signature
|   |   |-- controller.type.ts // must match the signature of the route handler
|   |   |-- repository.type.ts // must satisfy the interface that services depend on
|   |-- loaders
|   |   |-- routes.ts // mount API routes
|   |   |-- global-middleware.ts // cors/body-parser
|   |   |-- logger.ts // winston
|   |   |-- mongo.ts // Mongoose connection setup
|   |   |-- redis.ts // Redis connection setup
|   |-- config.ts // Type-safely parsed dotenv
|   |-- app.ts
|   |-- server.ts
|-- scripts
|   |-- migrations // migrate-mongo init
|   |-- db-backup.ts
|   |-- db-restore.ts
|-- integration // Supertest endpoint tests
|   |-- fixtures
|   |-- helpers
|   |-- api
|   |   |-- v1 // Endpoint tests for v1 API
|-- .env.example
|-- .gitignore
|-- .prettierrc
|-- docker-compose.yml // mongo + redis
|-- eslint.config.mts
|-- tsconfig.json
|-- package.json
|-- README.md
```

## API version (`/v1`, `/v2`, ...)

Bumped only on a **public contract break** — any change that can cause a compliant client to fail:

- Request/response shape changes
- New, removed, or renamed fields
- HTTP status or error shape changes
- Behavior changes relative to documented contract

Additive changes (new optional fields, new endpoints) and bug fixes that align implementation with existing documentation are **not** a version bump.

Non-compliant clients — those coupled to undocumented or incorrect behavior — have no claim on stability. Favoring them is an explicit, documented exception, not a default.

Re-exports from previous versions are allowed, enabling clients to leap-frog from v1 to vN without migrating through every intermediate version. Once a version re-exports from a newer one, its stability guarantees are weakened — this must be documented.

## Module version (`major.minor.patch`)

Follows semver independently of the API version, at a finer granularity:

| Segment | Trigger                                                          |
| ------- | ---------------------------------------------------------------- |
| Major   | Public contract break — always in sync with an API version bump  |
| Minor   | Additive changes, doc/impl corrections, new optional fields      |
| Patch   | Internal fixes, performance, refactors with no observable change |

Major module version and API version must stay in sync. If they diverge, the mapping between a deployed API version and a codebase version is lost.

## ESLint architecture rules

**`eslint-plugin-boundaries`**

- `boundaries/element-types` — enforces allowed import directions between layers (routes → controllers → services → repositories). Default is `disallow`; every cross-layer import must be explicitly permitted.

**`eslint-plugin-import`**

- `no-restricted-imports` — prevents `*.schema.ts` files from being imported outside their own model directory.
- `no-restricted-imports` — prevents `config.ts` from being imported outside `loaders/` and `app.ts`.

**`eslint-plugin-unicorn`**

- `unicorn/filename-case` — enforces file suffix conventions per directory (`.route.ts`, `.service.ts`, `.repository.ts`, `.middleware.ts`, `.mappers.ts`, `.type.ts`) via per-glob overrides.

**Built-in ESLint**

- `no-restricted-syntax` — prevents throwing raw `Error`; each layer must throw its own typed error class (`ControllerError`, `ServiceError`, etc.).
