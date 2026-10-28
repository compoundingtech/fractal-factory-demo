import { Fractal } from 'fractal'

/** Finds failed runs and blocked gates. */
export const runAnalyst = Fractal.agent({
  id: 'run-analyst',
  lifecycle: 'standing',
  host: 'local',
  workspace: '/work/factory',
  harness: {
    kind: 'claude',
    model: 'claude-opus-5',
    effort: 'medium',
  },
})

/** Proposes and applies factory changes. */
export const factoryEditor = Fractal.agent({
  id: 'factory-editor',
  lifecycle: 'standing',
  host: 'local',
  workspace: '/work/factory',
  harness: {
    kind: 'codex',
    model: 'gpt-5.6-sol',
    effort: 'high',
  },
})

/** You approve changes before they are applied. */
export const you = Fractal.person({ id: 'you' })
