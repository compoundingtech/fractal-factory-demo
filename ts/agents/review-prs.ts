import { Fractal } from 'fractal'

/** Runs the pull request and its tests. */
export const prTester = Fractal.agent({
  id: 'pr-tester',
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
export const prReviewer = Fractal.agent({
  id: 'pr-reviewer',
  lifecycle: 'standing',
  host: 'local',
  workspace: '/work/review',
  harness: {
    kind: 'claude',
    model: 'claude-opus-5',
    effort: 'high',
  },
})

/** You decide whether to sign off the review. */
export const you = Fractal.person({ id: 'you' })
