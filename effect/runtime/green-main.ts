import greenMain from '#missions/green-main'
import { GitHub } from '#services/github'
import { FetchHttpClient } from '@effect/platform'
import { Effect, Layer } from 'effect'
import { Fractal } from 'fractal/effect'

const adapters = Layer.mergeAll(
  // Launches each agent by its harness.kind
  Fractal.Harness.local,
  Fractal.Workspace.local,
  Fractal.Host.local,
  GitHub.Default.pipe(
    Layer.provide(FetchHttpClient.layer),
  ),
)

/** The local engine, given the adapters it needs. */
export const runtime = Fractal.Engine.local.pipe(
  // provideMerge keeps the adapters for steps too
  Layer.provideMerge(adapters),
)

/** Starts the mission or resumes its journal. */
export const main = Fractal.run(greenMain).pipe(
  Effect.provide(runtime),
)
