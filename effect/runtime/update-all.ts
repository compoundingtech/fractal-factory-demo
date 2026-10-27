import updateAll from '#missions/update-all'
import { Effect, Layer } from 'effect'
import { Fractal } from 'fractal/effect'

const adapters = Layer.mergeAll(
  // Launches each agent by its harness.kind
  Fractal.Harness.local,
  Fractal.Workspace.local,
  Fractal.Host.local,
)

/** The local engine, given the adapters it needs. */
export const runtime = Fractal.Engine.local.pipe(
  // provideMerge keeps the adapters for steps too
  Layer.provideMerge(adapters),
)

/** Starts the mission or resumes its journal. */
export const main = Fractal.run(updateAll).pipe(
  Effect.provide(runtime),
)
