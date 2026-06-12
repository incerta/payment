# AGENTS.md

Canonical instructions for AI coding agents working in this repository.

## Read First

- Project overview: [README.md](README.md)
- Project setup/architecture/versioning: [CONTRIBUTING.md](CONTRIBUTING.md)
- Project dependencies & scripts: [package.json](package.json)

## Architecture Contract

Layering is strict and one-directional:

- **Import direction is enforced:** contract ← route ← controller ← service ← model.
  Never import upward (e.g. a service must never import a controller).
- **Contract is the starting point** start from contract -> integration tests -> implementation
- **Validation lives in routes only.** Never validate request shape inside controllers or services.
- **Response validation is automatic via contract middleware** — do not duplicate it in controllers.
- **No HTTP in services.** Services return domain values/errors; status codes are a controller/contract concern.
- **Middleware is route-level only.** Never call middleware functions directly from controllers or services.
