// A comments feature is ready to build.
// API and platform developers build it together.
// Tests pass, then you decide whether to release.

import { you, developer } from '#agents/ship-comments'
import { Fractal } from 'fractal'

const platforms = [
  { id: 'web', name: 'the web' },
  { id: 'ios', name: 'iOS' },
  { id: 'android', name: 'Android' },
] as const

class Declined extends Error {}

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
    timeout: '5d',
    reportTo: developer('qa'),
    goal: 'Comments work on web, iOS and Android.',
    constraints: [
      'One spec everywhere, no platform extras.',
    ],
  },
  async () => {
    await Fractal.Worker.provide(
      developer('api'),
      () =>
        Fractal.step(
          {
            id: 'api',
            timeout: '1d',
            goal: 'The API serves the shared schema.',
          },
          () => ci('api'),
        ),
    )
    // Wait for the API before building each client
    await Promise.all(
      platforms.map(({ id, name }) =>
        Fractal.Worker.provide(developer(id), () =>
          Fractal.step(
            {
              id,
              timeout: '2d',
              goal: `Comments work on ${name}.`,
            },
            () => ci(`${id}-e2e`),
          ),
        ),
      ),
    )
    // Use the same tests to catch platform differences
    await Fractal.Worker.provide(developer('qa'), () =>
      Fractal.step(
        {
          id: 'parity',
          timeout: '2h',
          goal: 'Each platform passes the same suite.',
        },
        () =>
          Fractal.gate({
            name: 'parity',
            exec: ['pnpm', 'test:parity'],
          }),
      ),
    )
    // Wait for your approval before releasing
    await Fractal.step({ id: 'approve' }, async () => {
      const answer = await Fractal.ask({
        name: 'You approve the release',
        reviewer: you,
        question: 'Ship comments on every platform?',
      })
      if (answer._tag === 'Rejected')
        throw new Declined()
    })
  },
)
