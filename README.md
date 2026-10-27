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

## Layout

- `effect/` — Effect programs using the real Effect 3 library
- `ts/` — matching async/await programs
- `kdl/` — declarative projections where the control flow is static
- Each language groups files by boundary: `missions/`, `agents/`,
  `runtime/` and `schedule/` where applicable
- `services/` holds typed provider declarations
- `stubs/` holds the proposed Fractal API declarations

The seven missions cover updating dependencies, shipping comments,
reviewing pull requests, improving the factory, burning down a backlog,
comparing agent setups and keeping main green. Names such as `acme/app`
and `ada` are fictional.

Package import aliases keep boundary imports short, for example
`#agents/review`. Comments remain part of the examples.

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
