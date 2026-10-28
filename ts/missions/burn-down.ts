import {
  ada,
  maintainer,
  reviewer,
} from '#agents/burn-down'
import { github } from '#services/github'
import { metrics } from '@opentelemetry/api'
import { Fractal } from 'fractal'

class Pending extends Error {}

const repo = 'acme/app'
const closed = metrics
  .getMeter('acme')
  .createCounter('issues_closed')

// Typed issues, streamed oldest first, journaled
const inspect = () =>
  Fractal.step({ id: 'inspect' }, () =>
    Array.fromAsync(
      github.issues({
        repo,
        label: 'backlog',
        state: 'open',
      }),
    ),
  )

const round = async (n: number): Promise<void> => {
  const [issue] = await inspect()
  if (issue === undefined) return
  const branch = `backlog/${issue.number}`
  await Fractal.Worker.provide(maintainer, () =>
    Fractal.step(
      {
        id: 'fix',
        timeout: '1h',
        goal: `Fix #${issue.number} in one PR.`,
      },
      () =>
        Fractal.gate({
          name: 'CI passed',
          ciPassed: { check: 'ci', repo, branch },
        }),
    ),
  )
  await Fractal.Worker.provide(reviewer, () =>
    Fractal.step(
      {
        id: 'review',
        timeout: '30m',
        goal: `Merge once #${issue.number} is fixed.`,
      },
      () =>
        Fractal.gate({
          name: 'the issue closed',
          check: async () =>
            (
              await github.issue({
                repo,
                number: issue.number,
              })
            ).state === 'closed',
        }),
    ),
  )
  closed.add(1, { repo })
  // Read again, issues may have joined meanwhile
  const left = await inspect()
  if (left.length === 0) return
  // Eight rounds at most, and only open issues repeat
  if (n === 8) throw new Pending()
  return round(n + 1)
}

/** Burn down the backlog, one issue per round. */
export default Fractal.mission(
  {
    id: 'backlog/burn-down',
    state: 'ready',
    timeout: '1d',
    reportTo: ada,
    goal: 'No acme/app issue is labelled backlog.',
    constraints: ['One issue per pull request.'],
  },
  () => round(1),
)
