// The main branch has failing checks.
// A CI fixer repairs and checks it again.
// You get a report when it passes or stops.

import { you, ciFixer } from '#agents/fix-ci'
import { GitHub } from '#services/github'
import { Data, Effect, Metric, Schedule } from 'effect'
import { Fractal } from 'fractal/effect'

class StillRed extends Data.TaggedError('StillRed') {}

const tokens = Metric.counter('agent_tokens').pipe(
  Metric.tagged('mission', 'fix-ci'),
)

// Save the check result so resumed runs reuse it
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
    Effect.provide(Fractal.Worker.layer(ciFixer)),
  )
  // Show token use without stopping the repair
  yield* Metric.incrementBy(tokens, turn.tokens)
  yield* inspect
})

/** Repair failing checks on main. */
export default Fractal.mission(
  {
    id: 'fix-ci',
    state: 'ready',
    timeout: '4 hours',
    reportTo: you,
    goal: 'CI on main is green again.',
    constraints: [
      'Do not skip, delete or retry away tests.',
    ],
  },
  () =>
    inspect.pipe(
      // Repair failing checks but stop on other errors
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
