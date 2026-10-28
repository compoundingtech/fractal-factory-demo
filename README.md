# Fractal Factory-as-code examples

The source of the Factory-as-code examples on [fractal.how](https://fractal.how).
The site fetches an immutable revision and displays these files directly.

## Design target, not a runtime

The Effect and TypeScript APIs describe a **design target** for Fractal.
`stubs/effect.d.ts` types `import { Fractal } from 'fractal/effect'`.
`stubs/fractal.d.ts` gives the async/await flavour the same contract.
The GitHub provider declarations are also design targets.
These declarations validate types but do not implement execution, durable
journaling, agent launch, authentication or graph publication.

Steps derive worker needs from their code, not an `agentless` option.
An Effect step with a body preserves that body's context requirements.
Only worker turns require `Fractal.Worker`, so gates and approvals alone
do not acquire a worker. The async/await projection follows the same rule.
KDL steps without an explicit or inherited worker selector are agentless.

## Layout

- `effect/` — Effect programs using the real Effect 3 library
- `ts/` — matching async/await programs
- `kdl/` — declarative projections where the control flow is static
- Each language groups files by boundary: `missions/`, `agents/`,
  `runtime/` and `schedule/` where applicable
- `services/` holds typed provider declarations
- `stubs/` holds the proposed Fractal API declarations

The seven missions cover updating dependencies, shipping comments,
reviewing pull requests, improving the factory, fixing a backlog,
comparing agent setups and repairing main's checks. Their file names
and mission ids are `update-deps`, `ship-comments`, `review-prs`,
`improve-factory`, `fix-backlog`, `eval-flaky-test` and `fix-ci`.
`update-deps` also names the weekly schedule.

Agent ids are flat job names such as `api-dev` and `backlog-fixer`,
unique across scenarios. The person `you` means the reader deciding
whether to approve the work, referenced as `person/you` in KDL.
Repository names such as `acme/app` are fictional.

Package import aliases keep boundary imports short, for example
`#agents/review-prs`. Each mission starts with its story, and its step
comments explain why the work is ordered that way. Agent files describe
each job. Effect, TypeScript and KDL use the same names and roles.

## Checks

Use Node 24 and the pnpm version declared in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm format:check
pnpm lint
```

Formatting follows the effect-utils configuration at `81ce93345`, with
`printWidth: 55`. Linting uses its built-in baseline and four general
TypeScript rules, fetched from that immutable revision into `.cache/`.
The checks validate examples against the design target, not a running
Fractal engine.
