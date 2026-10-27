import { ada, collab } from '#agents/comments'
import { Command } from '@effect/platform'
import { Data, Effect } from 'effect'
import { Fractal } from 'fractal/effect'

const platforms = [
  { id: 'web', name: 'the web' },
  { id: 'ios', name: 'iOS' },
  { id: 'android', name: 'Android' },
] as const

class Declined extends Data.TaggedError('Declined') {}

const ci = (check: string) =>
  Fractal.gate({
    name: check,
    ciPassed: {
      check,
      repo: 'acme/app',
      branch: 'comments',
    },
  })

/** Ship comments on every platform from one API. */
export default Fractal.mission(
  {
    id: 'collab/comments',
    state: 'ready',
    timeout: '5 days',
    reportTo: collab('qa'),
    goal: 'Comments work on web, iOS and Android.',
    constraints: [
      'One spec everywhere, no platform extras.',
    ],
  },
  () =>
    Effect.gen(function* () {
      yield* Fractal.step(
        {
          id: 'api',
          timeout: '1 day',
          goal: 'The API serves the shared schema.',
        },
        ci('api'),
      ).pipe(
        Effect.provide(
          Fractal.Worker.layer(collab('api')),
        ),
      )
      // Platforms start together once the API passed
      yield* Effect.forEach(
        platforms,
        ({ id, name }) =>
          Fractal.step(
            {
              id,
              timeout: '2 days',
              goal: `Comments work on ${name}.`,
            },
            ci(`${id}-e2e`),
          ).pipe(
            Effect.provide(
              Fractal.Worker.layer(collab(id)),
            ),
          ),
        { concurrency: 'unbounded' },
      )
      // One scenario suite, run against every platform
      yield* Fractal.step(
        {
          id: 'parity',
          timeout: '2 hours',
          goal: 'Each platform passes the same suite.',
        },
        Fractal.gate({
          name: 'parity',
          exec: Command.make('pnpm', 'test:parity'),
        }),
      ).pipe(
        Effect.provide(
          Fractal.Worker.layer(collab('qa')),
        ),
      )
      // A person decides, a no stops the release
      yield* Fractal.step(
        { id: 'approve', agentless: true },
        Fractal.ask({
          name: 'You approve the release',
          reviewer: ada,
          question: 'Ship comments on every platform?',
        }).pipe(
          Effect.filterOrFail(
            (answer) => answer._tag === 'Approved',
            () => new Declined(),
          ),
        ),
      )
    }),
)
