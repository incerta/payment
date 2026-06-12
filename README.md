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

API (`/api/v1`) is the HTTP boundary.

- **Routes** – bind middleware and controllers to paths
- **DTO** (`src/api/v1/dto`) – request/response Zod schemas (with property constraints)
- **Controllers** – parse request DTO, call services, map and (dev/test-only) validate response DTO
- **Middleware** (`src/middleware`) – authentication & security, independent from API versioning
- **Services** – business logic
- **Models** – persistence

> Import direction: [routes <- controllers <- services <- models], and [routes <- middleware].

Response contract validation is enabled only when `NODE_ENV !== 'production'`.

```
|-- src
|   |-- api
|   |   |-- v1
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
|   |   |   |-- fixtures
|   |-- middleware
|   |   |-- <middleware_name>
|   |   |   |-- <middleware_name>.middleware.ts
|   |-- services
|   |-- models
|   |-- core
|   |   |-- error.ts
|   |   |-- route-deprecate-middleware.ts
|   |-- loaders
|   |-- config.ts
|   |-- app.ts
|   |-- server.ts
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
