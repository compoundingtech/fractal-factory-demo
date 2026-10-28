import updateDeps from '#missions/update-deps'
import { Fractal } from 'fractal'

/** Run locally with the required tools. */
export const runtime = Fractal.runtime({
  engine: Fractal.Engine.local(),
  // Start each agent with its chosen harness
  harness: Fractal.Harness.local(),
  workspace: Fractal.Workspace.local(),
  host: Fractal.Host.local(),
})

/** Start the mission or resume saved work. */
export const main = () =>
  Fractal.run(updateDeps, { runtime })
