import { ada, maintainer } from '#agents/green-main'
import { github } from '#services/github'
import { metrics } from '@opentelemetry/api'
import { Fractal } from 'fractal'

class StillRed extends Error {}

const tokens = metrics
  .getMeter('acme')
  .createCounter('agent_tokens')

// A step, so a replay reads the journaled answer
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
  // Only a red main repeats, six rounds at most
  if (n > 6) throw new StillRed()
  const turn = await Fractal.Worker.provide(
    maintainer,
    () =>
      Fractal.step({
        id: 'fix',
        timeout: '1h',
        goal: 'Fix the next CI failure on main.',
      }),
  )
  // Tracked for dashboards, never a hard stop
  tokens.add(turn.tokens, { mission: 'ci/green-main' })
  return round(n + 1)
}

/** Get CI on main green again, six rounds at most. */
export default Fractal.mission(
  {
    id: 'ci/green-main',
    state: 'ready',
    timeout: '4h',
    reportTo: ada,
    goal: 'CI on main is green again.',
    constraints: [
      'Do not skip, delete or retry away tests.',
    ],
  },
  () => round(1),
)
