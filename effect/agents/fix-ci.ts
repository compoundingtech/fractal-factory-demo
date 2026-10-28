import { Fractal } from 'fractal/effect'

/** Repairs failing checks on main. */
export const ciFixer = Fractal.agent({
  id: 'ci-fixer',
  lifecycle: 'standing',
  host: 'local',
  workspace: '/work/app',
  harness: {
    kind: 'codex',
    model: 'gpt-5.6-sol',
    effort: 'high',
  },
})

/** You receive the final report. */
export const you = Fractal.person({ id: 'you' })
