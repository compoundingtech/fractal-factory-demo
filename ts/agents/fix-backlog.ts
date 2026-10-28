import { Fractal } from 'fractal'

/** Fixes one backlog issue per round. */
export const backlogFixer = Fractal.agent({
  id: 'backlog-fixer',
  lifecycle: 'standing',
  host: 'local',
  workspace: '/work/app',
  harness: {
    kind: 'codex',
    model: 'gpt-5.6-sol',
    effort: 'medium',
  },
})

/** Reviews each fix before merging it. */
export const codeReviewer = Fractal.agent({
  id: 'code-reviewer',
  lifecycle: 'standing',
  host: 'local',
  workspace: '/work/app-review',
  harness: {
    kind: 'claude',
    model: 'claude-opus-5',
    effort: 'high',
  },
})

/** You receive the final report. */
export const you = Fractal.person({ id: 'you' })
