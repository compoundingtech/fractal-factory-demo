import { maintainer } from '#agents/update-all'
import { Fractal } from 'fractal'

const repos = ['app', 'api', 'docs'] as const

/** Keep every repo on current dependencies. */
export default Fractal.mission(
  {
    id: 'deps/update-all',
    state: 'ready',
    timeout: '2h',
    reportTo: maintainer('app'),
    goal: 'Every repo runs current deps, CI green.',
    constraints: [
      'No major bumps without a migration note.',
    ],
  },
  async () => {
    // One maintainer per repo, all at once
    await Promise.all(
      repos.map((repo) =>
        Fractal.Worker.provide(maintainer(repo), () =>
          Fractal.step(
            {
              id: repo,
              timeout: '1h',
              goal: `A green deps PR in acme/${repo}.`,
            },
            // CI, not the agent, says a repo is done
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
    // Starts once every repo passed its gate
    await Fractal.Worker.provide(
      maintainer('app'),
      () =>
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
