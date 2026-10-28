// The main branch has failing checks.
// A CI fixer repairs and checks it again.
// You get a report when it passes or stops.

import { you, ciFixer } from '#agents/fix-ci'
import { github } from '#services/github'
import { metrics } from '@opentelemetry/api'
import { Fractal } from 'fractal'

class StillRed extends Error {}

const tokens = metrics
  .getMeter('acme')
  .createCounter('agent_tokens')

// Save the check result so resumed runs reuse it
const inspect = () =>
  Fractal.step({ id: 'inspect' }, async () => {
    const run = await github.checkRun({
      repo: 'acme/app',
      ref: 'main',
      name: 'ci',
    })
    return run.conclusion === 'success'
  })

const round = async (n: number): Promise<void> => {
  if ((await inspect()) === true) return
  // Limit repairs to six rounds while main is failing
  if (n > 6) throw new StillRed()
  const turn = await Fractal.Worker.provide(
    ciFixer,
    () =>
      Fractal.step({
        id: 'fix',
        timeout: '1h',
        goal: 'Fix the next CI failure on main.',
      }),
  )
  // Show token use without stopping the repair
  tokens.add(turn.tokens, { mission: 'fix-ci' })
  return round(n + 1)
}

/** Repair failing checks on main. */
export default Fractal.mission(
  {
    id: 'fix-ci',
    state: 'ready',
    timeout: '4h',
    reportTo: you,
    goal: 'CI on main is green again.',
    constraints: [
      'Do not skip, delete or retry away tests.',
    ],
  },
  () => round(1),
)
