// Failed runs and waits for you reveal problems.
// An analyst and editor test one factory change.
// You approve it before it is applied.

import {
  you,
  runAnalyst,
  factoryEditor,
} from '#agents/improve-factory'
import { Command } from '@effect/platform'
import { Data, Effect } from 'effect'
import { Fractal } from 'fractal/effect'

class Declined extends Data.TaggedError('Declined') {}

/** Test and apply one factory improvement. */
export default Fractal.mission(
  {
    id: 'improve-factory',
    state: 'ready',
    timeout: '2 days',
    reportTo: factoryEditor,
    goal: "The week's worst friction is gone.",
    constraints: [
      'Only edit declarations. Keep every gate.',
    ],
  },
  () =>
    Effect.gen(function* () {
      // Use failures and waits to choose one change
      yield* Effect.all(
        [
          Fractal.step(
            {
              id: 'failures',
              timeout: '30 minutes',
              goal: 'List failed runs, stuck gates.',
            },
            Fractal.gate({
              name: 'failures published',
              document: 'doc/factory/failures',
            }),
          ).pipe(
            Effect.provide(
              Fractal.Worker.layer(runAnalyst),
            ),
          ),
          Fractal.step(
            {
              id: 'asks',
              timeout: '30 minutes',
              goal: 'List asks and their wait times.',
            },
            Fractal.gate({
              name: 'asks published',
              document: 'doc/factory/asks',
            }),
          ).pipe(
            Effect.provide(
              Fractal.Worker.layer(factoryEditor),
            ),
          ),
        ],
        { concurrency: 'unbounded' },
      )
      // Replay failed runs to test the proposed change
      yield* Fractal.step(
        {
          id: 'propose',
          timeout: '2 hours',
          goal: 'One PR changes one declaration.',
        },
        Fractal.gate({
          name: 'the replays pass',
          exec: Command.make(
            './scripts/replay.sh',
            'doc/factory/failures',
          ),
          timeout: '30 minutes',
        }),
      ).pipe(
        Effect.provide(
          Fractal.Worker.layer(factoryEditor),
        ),
      )
      // Wait for your approval before applying changes
      yield* Fractal.step(
        { id: 'approve' },
        Fractal.ask({
          name: 'You approve the change',
          reviewer: you,
          question: 'Apply the improved declarations?',
        }).pipe(
          Effect.filterOrFail(
            (answer) => answer._tag === 'Approved',
            () => new Declined(),
          ),
        ),
      )
      yield* Fractal.step(
        {
          id: 'apply',
          timeout: '30 minutes',
          goal: 'Merge it, then run fractal apply.',
        },
        Fractal.gate({
          name: 'CI passed on main',
          ciPassed: {
            check: 'ci',
            repo: 'acme/factory',
            branch: 'main',
          },
        }),
      ).pipe(
        Effect.provide(
          Fractal.Worker.layer(factoryEditor),
        ),
      )
    }),
)
