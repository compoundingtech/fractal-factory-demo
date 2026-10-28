import {
  ada,
  analyst,
  steward,
} from '#agents/self-improve'
import { Command } from '@effect/platform'
import { Data, Effect } from 'effect'
import { Fractal } from 'fractal/effect'

class Declined extends Data.TaggedError('Declined') {}

/** Remove the week's worst factory friction. */
export default Fractal.mission(
  {
    id: 'factory/self-improve',
    state: 'ready',
    timeout: '2 days',
    reportTo: steward,
    goal: "The week's worst friction is gone.",
    constraints: [
      'Only edit declarations. Keep every gate.',
    ],
  },
  () =>
    Effect.gen(function* () {
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
              Fractal.Worker.layer(analyst),
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
              Fractal.Worker.layer(steward),
            ),
          ),
        ],
        { concurrency: 'unbounded' },
      )
      // The change must replay last week's failures
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
        Effect.provide(Fractal.Worker.layer(steward)),
      )
      // Only a yes goes on, a no ends the mission
      yield* Fractal.step(
        { id: 'approve' },
        Fractal.ask({
          name: 'You approve the change',
          reviewer: ada,
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
        Effect.provide(Fractal.Worker.layer(steward)),
      )
    }),
)
