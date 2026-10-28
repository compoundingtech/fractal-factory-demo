// Open issues are waiting in the backlog.
// A fixer and reviewer handle one issue at a time.
// You get a report after up to eight rounds.

import {
  you,
  backlogFixer,
  codeReviewer,
} from '#agents/fix-backlog'
import { GitHub } from '#services/github'
import { Data, Effect, Metric, Stream } from 'effect'
import { Fractal } from 'fractal/effect'

class Pending extends Data.TaggedError('Pending') {}

const repo = 'acme/app'
const closed = Metric.counter('issues_closed').pipe(
  Metric.tagged('repo', repo),
)

// Save the issue list so resumed runs reuse it
const inspect = Fractal.step(
  { id: 'inspect' },
  GitHub.issues({
    repo,
    label: 'backlog',
    state: 'open',
  }).pipe(Stream.runCollect),
)

const round = Effect.gen(function* () {
  const [issue] = yield* inspect
  if (issue === undefined) return
  // Keep each repair separate so it can be reviewed
  const branch = `backlog/${issue.number}`
  yield* Fractal.step(
    {
      id: 'fix',
      timeout: '1 hour',
      goal: `Fix #${issue.number} in one PR.`,
    },
    Fractal.gate({
      name: 'CI passed',
      ciPassed: { check: 'ci', repo, branch },
    }),
  ).pipe(
    Effect.provide(Fractal.Worker.layer(backlogFixer)),
  )
  // Review the repair before closing the issue
  yield* Fractal.step(
    {
      id: 'review',
      timeout: '30 minutes',
      goal: `Merge once #${issue.number} is fixed.`,
    },
    Fractal.gate({
      name: 'the issue closed',
      check: GitHub.issue({
        repo,
        number: issue.number,
      }).pipe(
        Effect.map((it) => it.state === 'closed'),
      ),
    }),
  ).pipe(
    Effect.provide(Fractal.Worker.layer(codeReviewer)),
  )
  yield* Metric.increment(closed)
  // Check again because new issues may have arrived
  const left = yield* inspect
  if (left.length > 0) return yield* new Pending()
})

/** Repair backlog issues one at a time. */
export default Fractal.mission(
  {
    id: 'fix-backlog',
    state: 'ready',
    timeout: '1 day',
    reportTo: you,
    goal: 'No acme/app issue is labelled backlog.',
    constraints: ['One issue per pull request.'],
  },
  // Stop after eight rounds if issues remain
  () =>
    round.pipe(
      Effect.retry({
        times: 7,
        while: (error) => error._tag === 'Pending',
      }),
    ),
)
