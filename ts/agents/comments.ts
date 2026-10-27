import { Fractal } from 'fractal'

/** One agent per part of the feature. */
export const collab = (part: string) =>
  Fractal.agent({
    id: `collab/${part}`,
    lifecycle: 'standing',
    host: 'local',
    workspace: '/work/app',
    harness: {
      kind: 'codex',
      model: 'gpt-5.6-sol',
      effort: 'high',
    },
  })

/** Approves the release, a person, not an agent. */
export const ada = Fractal.person({ id: 'ada' })
