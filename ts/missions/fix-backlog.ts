// Open issues are waiting in the backlog.
// A fixer and reviewer handle one issue at a time.
// You get a report after up to eight rounds.

import {
  you,
  backlogFixer,
  codeReviewer,
} from '#agents/fix-backlog'
import { github } from '#services/github'
import { metrics } from '@opentelemetry/api'
import { Fractal } from 'fractal'

class Pending extends Error {}

const repo = 'acme/app'
const closed = metrics
  .getMeter('acme')
  .createCounter('issues_closed')

// Save the issue list so resumed runs reuse it
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
  // Keep each repair separate so it can be reviewed
  const branch = `backlog/${issue.number}`
  await Fractal.Worker.provide(backlogFixer, () =>
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
  // Review the repair before closing the issue
  await Fractal.Worker.provide(codeReviewer, () =>
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
  // Check again because new issues may have arrived
  const left = await inspect()
  if (left.length === 0) return
  // Stop after eight rounds if issues remain
  if (n === 8) throw new Pending()
  return round(n + 1)
}

/** Repair backlog issues one at a time. */
export default Fractal.mission(
  {
    id: 'fix-backlog',
    state: 'ready',
    timeout: '1d',
    reportTo: you,
    goal: 'No acme/app issue is labelled backlog.',
    constraints: ['One issue per pull request.'],
  },
  () => round(1),
)
