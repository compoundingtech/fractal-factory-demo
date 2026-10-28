// A comments feature is ready to build.
// API and platform developers build it together.
// Tests pass, then you decide whether to release.

import { you, developer } from '#agents/ship-comments'
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

/** Build comments across all platforms. */
export default Fractal.mission(
  {
    id: 'ship-comments',
    state: 'ready',
    timeout: '5 days',
    reportTo: developer('qa'),
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
          Fractal.Worker.layer(developer('api')),
        ),
      )
      // Wait for the API before building each client
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
              Fractal.Worker.layer(developer(id)),
            ),
          ),
        { concurrency: 'unbounded' },
      )
      // Use the same tests to catch platform
      // differences
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
          Fractal.Worker.layer(developer('qa')),
        ),
      )
      // Wait for your approval before releasing
      yield* Fractal.step(
        { id: 'approve' },
        Fractal.ask({
          name: 'You approve the release',
          reviewer: you,
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
