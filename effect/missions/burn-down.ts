import {
  ada,
  maintainer,
  reviewer,
} from '#agents/burn-down'
import { GitHub } from '#services/github'
import { Data, Effect, Metric, Stream } from 'effect'
import { Fractal } from 'fractal/effect'

class Pending extends Data.TaggedError('Pending') {}

const repo = 'acme/app'
const closed = Metric.counter('issues_closed').pipe(
  Metric.tagged('repo', repo),
)

// Typed issues, streamed oldest first, journaled
const inspect = Fractal.step(
  { id: 'inspect', agentless: true },
  GitHub.issues({
    repo,
    label: 'backlog',
    state: 'open',
  }).pipe(Stream.runCollect),
)

const round = Effect.gen(function* () {
  const [issue] = yield* inspect
  if (issue === undefined) return
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
    Effect.provide(Fractal.Worker.layer(maintainer)),
  )
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
    Effect.provide(Fractal.Worker.layer(reviewer)),
  )
  yield* Metric.increment(closed)
  // Read again, issues may have joined meanwhile
  const left = yield* inspect
  if (left.length > 0) return yield* new Pending()
})

/** Burn down the backlog, one issue per round. */
export default Fractal.mission(
  {
    id: 'backlog/burn-down',
    state: 'ready',
    timeout: '1 day',
    reportTo: ada,
    goal: 'No acme/app issue is labelled backlog.',
    constraints: ['One issue per pull request.'],
  },
  // Eight rounds at most, and only open issues repeat
  () =>
    round.pipe(
      Effect.retry({
        times: 7,
        while: (error) => error._tag === 'Pending',
      }),
    ),
)
