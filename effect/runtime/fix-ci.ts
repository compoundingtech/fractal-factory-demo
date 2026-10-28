import fixCi from '#missions/fix-ci'
import { GitHub } from '#services/github'
import { FetchHttpClient } from '@effect/platform'
import { Effect, Layer } from 'effect'
import { Fractal } from 'fractal/effect'

const adapters = Layer.mergeAll(
  // Start each agent with its chosen harness
  Fractal.Harness.local,
  Fractal.Workspace.local,
  Fractal.Host.local,
  GitHub.Default.pipe(
    Layer.provide(FetchHttpClient.layer),
  ),
)

/** Run locally with the required tools. */
export const runtime = Fractal.Engine.local.pipe(
  // Keep these tools available to mission steps
  Layer.provideMerge(adapters),
)

/** Start the mission or resume saved work. */
export const main = Fractal.run(fixCi).pipe(
  Effect.provide(runtime),
)
