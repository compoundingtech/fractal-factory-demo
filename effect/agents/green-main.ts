import { Fractal } from 'fractal/effect'

/** Keeps main green in the app checkout. */
export const maintainer = Fractal.agent({
  id: 'app/maintainer',
  lifecycle: 'standing',
  host: 'local',
  workspace: '/work/app',
  harness: {
    kind: 'codex',
    model: 'gpt-5.6-sol',
    effort: 'high',
  },
})

/** Gets the report, a person, not an agent. */
export const ada = Fractal.person({ id: 'ada' })
