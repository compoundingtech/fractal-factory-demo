import { Fractal } from 'fractal/effect'

/** Fixes one issue per round in the app checkout. */
export const maintainer = Fractal.agent({
  id: 'app/maintainer',
  lifecycle: 'standing',
  host: 'local',
  workspace: '/work/app',
  harness: {
    kind: 'codex',
    model: 'gpt-5.6-sol',
    effort: 'medium',
  },
})

/** Reviews and merges, in a checkout of its own. */
export const reviewer = Fractal.agent({
  id: 'app/reviewer',
  lifecycle: 'standing',
  host: 'local',
  workspace: '/work/app-review',
  // A second model, so the fix gets fresh eyes
  harness: {
    kind: 'claude',
    model: 'claude-opus-5',
    effort: 'high',
  },
})

/** Gets the report, a person, not an agent. */
export const ada = Fractal.person({ id: 'ada' })
