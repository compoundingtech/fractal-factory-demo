import { Fractal } from 'fractal'

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
  // Change this setup to compare another harness
  candidate: { kind: 'opencode', model: 'kimi-k3' },
} as const

/** Creates one repair contender per setup. */
export const contender = (
  setup: keyof typeof harnesses,
) =>
  Fractal.agent({
    id: `${setup}-contender`,
    lifecycle: 'bounded',
    host: 'local',
    workspace: `/work/eval/${setup}`,
    harness: harnesses[setup],
  })

/** Compares the repairs and ranks them. */
export const evalJudge = Fractal.agent({
  id: 'eval-judge',
  lifecycle: 'standing',
  host: 'local',
  workspace: '/work/eval',
  harness: {
    kind: 'claude',
    model: 'claude-opus-5',
    effort: 'high',
  },
})
