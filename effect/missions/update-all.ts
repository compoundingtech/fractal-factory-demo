import { maintainer } from '#agents/update-all'
import { Effect } from 'effect'
import { Fractal } from 'fractal/effect'

const repos = ['app', 'api', 'docs'] as const

/** Keep every repo on current dependencies. */
export default Fractal.mission(
  {
    id: 'deps/update-all',
    state: 'ready',
    timeout: '2 hours',
    reportTo: maintainer('app'),
    goal: 'Every repo runs current deps, CI green.',
    constraints: [
      'No major bumps without a migration note.',
    ],
  },
  () =>
    Effect.gen(function* () {
      // One maintainer per repo, all at once
      yield* Effect.forEach(
        repos,
        (repo) =>
          Fractal.step(
            {
              id: repo,
              timeout: '1 hour',
              goal: `A green deps PR in acme/${repo}.`,
            },
            // CI, not the agent, says a repo is done
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
              Fractal.Worker.layer(maintainer(repo)),
            ),
          ),
        { concurrency: 'unbounded' },
      )
      // Starts once every repo passed its gate
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
          Fractal.Worker.layer(maintainer('app')),
        ),
      )
    }),
)
