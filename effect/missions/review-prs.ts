// A pull request is ready for review.
// A tester and reviewer gather the evidence.
// You decide whether to sign off the review.

import {
  you,
  prReviewer,
  prTester,
} from '#agents/review-prs'
import { Data, Effect, Schema } from 'effect'
import { Fractal } from 'fractal/effect'

class Unsigned extends Data.TaggedError('Unsigned') {}

/** Review a pull request with evidence. */
export default Fractal.mission(
  {
    id: 'review-prs',
    state: 'ready',
    timeout: '2 hours',
    reportTo: prReviewer,
    goal: 'The PR has an evidence-backed review.',
    constraints: [
      'Review only. Never approve or merge.',
    ],
    // Use the pull request that triggered this run
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
              Fractal.Worker.layer(prTester),
            ),
          ),
          Fractal.step({
            id: 'context',
            timeout: '15 minutes',
            goal: `Find the issues behind ${source}.`,
          }).pipe(
            Effect.provide(
              Fractal.Worker.layer(prReviewer),
            ),
          ),
        ],
        // Gather test results and context at the same
        // time
        { concurrency: 'unbounded' },
      )
      // Back the review with test results and context
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
        Effect.provide(
          Fractal.Worker.layer(prReviewer),
        ),
      )
      yield* Fractal.step(
        { id: 'sign-off' },
        Fractal.ask({
          name: 'You sign off the review',
          reviewer: you,
          question: 'Is this review ready to share?',
          timeout: '30 minutes',
        }).pipe(
          // Require your approval before signing off
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
