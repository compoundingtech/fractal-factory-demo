import { Fractal } from 'fractal/effect'

const harnesses = {
  codex: {
    kind: 'codex',
    model: 'gpt-5.6-sol',
    effort: 'medium',
  },
  claude: {
    kind: 'claude',
    model: 'claude-opus-5',
    effort: 'medium',
  },
  // The setup under test, swapped per eval run
  candidate: { kind: 'opencode', model: 'kimi-k3' },
} as const

/** One contender per setup, in its own checkout. */
export const contender = (
  setup: keyof typeof harnesses,
) =>
  Fractal.agent({
    id: `eval/${setup}`,
    lifecycle: 'bounded',
    host: 'local',
    workspace: `/work/eval/${setup}`,
    harness: harnesses[setup],
  })

/** Compares the contenders in one report. */
export const reporter = Fractal.agent({
  id: 'eval/reporter',
  lifecycle: 'standing',
  host: 'local',
  workspace: '/work/eval',
  harness: {
    kind: 'claude',
    model: 'claude-opus-5',
    effort: 'high',
  },
})
