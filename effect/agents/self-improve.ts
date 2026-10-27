import { Fractal } from 'fractal/effect'

/** Reads the week's runs and gates. */
export const analyst = Fractal.agent({
  id: 'factory/analyst',
  lifecycle: 'standing',
  host: 'local',
  workspace: '/work/factory',
  harness: {
    kind: 'claude',
    model: 'claude-opus-5',
    effort: 'medium',
  },
})

/** Owns the factory's declarations. */
export const steward = Fractal.agent({
  id: 'factory/steward',
  lifecycle: 'standing',
  host: 'local',
  workspace: '/work/factory',
  // It edits the factory itself, so it reasons hardest
  harness: {
    kind: 'codex',
    model: 'gpt-5.6-sol',
    effort: 'high',
  },
})

/** Approves the change, a person, not an agent. */
export const ada = Fractal.person({ id: 'ada' })
