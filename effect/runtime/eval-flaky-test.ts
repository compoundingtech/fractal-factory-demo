import evalFlakyTest from '#missions/eval-flaky-test'
import { Effect, Layer } from 'effect'
import { Fractal } from 'fractal/effect'

const adapters = Layer.mergeAll(
  // Start each agent with its chosen harness
  Fractal.Harness.local,
  Fractal.Workspace.local,
  Fractal.Host.local,
)

/** Run locally with the required tools. */
export const runtime = Fractal.Engine.local.pipe(
  // Keep these tools available to mission steps
  Layer.provideMerge(adapters),
)

/** Start the mission or resume saved work. */
export const main = Fractal.run(evalFlakyTest).pipe(
  Effect.provide(runtime),
)
