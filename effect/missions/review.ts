import { ada, reviewer, tester } from '#agents/review'
import { Data, Effect, Schema } from 'effect'
import { Fractal } from 'fractal/effect'

class Unsigned extends Data.TaggedError('Unsigned') {}

/** Review each new pull request with evidence. */
export default Fractal.mission(
  {
    id: 'github/review',
    state: 'ready',
    timeout: '2 hours',
    reportTo: reviewer,
    goal: 'The PR has an evidence-backed review.',
    constraints: [
      'Review only. Never approve or merge.',
    ],
    // The subscription passes the pull request it saw
    payload: Schema.Struct({
      source: Fractal.ResourceRef,
    }),
  },
  ({ source }) =>
    Effect.gen(function* () {
      yield* Effect.all(
        [
          Fractal.step({
            id: 'reproduce',
            timeout: '20 minutes',
            goal: `Run the tests of ${source}.`,
          }).pipe(
            Effect.provide(
              Fractal.Worker.layer(tester),
            ),
          ),
          Fractal.step({
            id: 'context',
            timeout: '15 minutes',
            goal: `Find the issues behind ${source}.`,
          }).pipe(
            Effect.provide(
              Fractal.Worker.layer(reviewer),
            ),
          ),
        ],
        // Tests and context run side by side
        { concurrency: 'unbounded' },
      )
      yield* Fractal.step(
        {
          id: 'review',
          timeout: '30 minutes',
          goal: 'Publish findings with evidence.',
        },
        Fractal.gate({
          name: 'review published',
          document: 'doc/github/review',
        }),
      ).pipe(
        Effect.provide(Fractal.Worker.layer(reviewer)),
      )
      yield* Fractal.step(
        { id: 'sign-off', agentless: true },
        Fractal.ask({
          name: 'You sign off the review',
          reviewer: ada,
          question: 'Is this review ready to share?',
          timeout: '30 minutes',
        }).pipe(
          // A no or a timeout leaves it unsigned
          Effect.filterOrFail(
            (answer) => answer._tag === 'Approved',
            () => new Unsigned(),
          ),
          Effect.catchTag(
            'TimedOut',
            () => new Unsigned(),
          ),
        ),
      )
    }),
)
