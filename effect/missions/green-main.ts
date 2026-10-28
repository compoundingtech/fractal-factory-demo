import { ada, maintainer } from '#agents/green-main'
import { GitHub } from '#services/github'
import { Data, Effect, Metric, Schedule } from 'effect'
import { Fractal } from 'fractal/effect'

class StillRed extends Data.TaggedError('StillRed') {}

const tokens = Metric.counter('agent_tokens').pipe(
  Metric.tagged('mission', 'ci/green-main'),
)

// A step, so a replay reads the journaled answer
const inspect = Fractal.step(
  { id: 'inspect' },
  GitHub.checkRun({
    repo: 'acme/app',
    ref: 'main',
    name: 'ci',
  }).pipe(
    Effect.filterOrFail(
      (run) => run.conclusion === 'success',
      () => new StillRed(),
    ),
  ),
)

const round = Effect.gen(function* () {
  const turn = yield* Fractal.step({
    id: 'fix',
    timeout: '1 hour',
    goal: 'Fix the next CI failure on main.',
  }).pipe(
    Effect.provide(Fractal.Worker.layer(maintainer)),
  )
  // Tracked for dashboards, never a hard stop
  yield* Metric.incrementBy(tokens, turn.tokens)
  yield* inspect
})

/** Get CI on main green again, six rounds at most. */
export default Fractal.mission(
  {
    id: 'ci/green-main',
    state: 'ready',
    timeout: '4 hours',
    reportTo: ada,
    goal: 'CI on main is green again.',
    constraints: [
      'Do not skip, delete or retry away tests.',
    ],
  },
  () =>
    inspect.pipe(
      // Only a red main repeats, other errors end it
      Effect.catchTag('StillRed', () =>
        round.pipe(
          Effect.retry({
            schedule: Schedule.recurs(5),
            while: (error) =>
              error._tag === 'StillRed',
          }),
        ),
      ),
    ),
)
