import comments from '#missions/comments'
import { Fractal } from 'fractal'

/** The local engine and the adapters it drives. */
export const runtime = Fractal.runtime({
  engine: Fractal.Engine.local(),
  // Launches each agent by its harness.kind
  harness: Fractal.Harness.local(),
  workspace: Fractal.Workspace.local(),
  host: Fractal.Host.local(),
})

/** Starts the mission or resumes its journal. */
export const main = () =>
  Fractal.run(comments, { runtime })
