// Weekly dependency updates are due.
// One bot per repo opens and tests its updates.
// A combined report shows what passed.

import { depsBot } from '#agents/update-deps'
import { Effect } from 'effect'
import { Fractal } from 'fractal/effect'

const repos = ['app', 'api', 'docs'] as const

/** Update dependencies across all repos. */
export default Fractal.mission(
  {
    id: 'update-deps',
    state: 'ready',
    timeout: '2 hours',
    reportTo: depsBot('app'),
    goal: 'Every repo runs current deps, CI green.',
    constraints: [
      'No major bumps without a migration note.',
    ],
  },
  () =>
    Effect.gen(function* () {
      // Update independent repos at the same time
      yield* Effect.forEach(
        repos,
        (repo) =>
          Fractal.step(
            {
              id: repo,
              timeout: '1 hour',
              goal: `A green deps PR in acme/${repo}.`,
            },
            // Require passing CI before counting an
            // update
            Fractal.gate({
              name: 'CI passed',
              ciPassed: {
                check: 'ci',
                repo: `acme/${repo}`,
                branch: 'deps/update',
              },
            }),
          ).pipe(
            Effect.provide(
              Fractal.Worker.layer(depsBot(repo)),
            ),
          ),
        { concurrency: 'unbounded' },
      )
      // Combine results only after every repo passes
      yield* Fractal.step(
        {
          id: 'report',
          timeout: '15 minutes',
          goal: 'A report links each PR and CI run.',
        },
        Fractal.gate({
          name: 'report published',
          document: 'doc/deps/report',
        }),
      ).pipe(
        Effect.provide(
          Fractal.Worker.layer(depsBot('app')),
        ),
      )
    }),
)
