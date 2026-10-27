import { Fractal } from 'fractal/effect'

/** Runs the pull request and its tests. */
export const tester = Fractal.agent({
  id: 'github/tester',
  lifecycle: 'standing',
  host: 'local',
  workspace: '/work/review',
  harness: {
    kind: 'codex',
    model: 'gpt-5.6-sol',
    effort: 'medium',
  },
})

/** Reads the change and writes the review. */
export const reviewer = Fractal.agent({
  id: 'github/reviewer',
  lifecycle: 'standing',
  host: 'local',
  workspace: '/work/review',
  // Judgment work gets the stronger setting
  harness: {
    kind: 'claude',
    model: 'claude-opus-5',
    effort: 'high',
  },
})

/** Signs the review off, a person, not an agent. */
export const ada = Fractal.person({ id: 'ada' })
