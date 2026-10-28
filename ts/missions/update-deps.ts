// Weekly dependency updates are due.
// One bot per repo opens and tests its updates.
// A combined report shows what passed.

import { depsBot } from '#agents/update-deps'
import { Fractal } from 'fractal'

const repos = ['app', 'api', 'docs'] as const

/** Update dependencies across all repos. */
export default Fractal.mission(
  {
    id: 'update-deps',
    state: 'ready',
    timeout: '2h',
    reportTo: depsBot('app'),
    goal: 'Every repo runs current deps, CI green.',
    constraints: [
      'No major bumps without a migration note.',
    ],
  },
  async () => {
    // Update independent repos at the same time
    await Promise.all(
      repos.map((repo) =>
        Fractal.Worker.provide(depsBot(repo), () =>
          Fractal.step(
            {
              id: repo,
              timeout: '1h',
              goal: `A green deps PR in acme/${repo}.`,
            },
            // Require passing CI before counting an
            // update
            () =>
              Fractal.gate({
                name: 'CI passed',
                ciPassed: {
                  check: 'ci',
                  repo: `acme/${repo}`,
                  branch: 'deps/update',
                },
              }),
          ),
        ),
      ),
    )
    // Combine results only after every repo passes
    await Fractal.Worker.provide(depsBot('app'), () =>
      Fractal.step(
        {
          id: 'report',
          timeout: '15m',
          goal: 'A report links each PR and CI run.',
        },
        () =>
          Fractal.gate({
            name: 'report published',
            document: 'doc/deps/report',
          }),
      ),
    )
  },
)
