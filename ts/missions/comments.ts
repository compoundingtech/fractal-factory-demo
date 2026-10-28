import { ada, collab } from '#agents/comments'
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

/** Ship comments on every platform from one API. */
export default Fractal.mission(
  {
    id: 'collab/comments',
    state: 'ready',
    timeout: '5d',
    reportTo: collab('qa'),
    goal: 'Comments work on web, iOS and Android.',
    constraints: [
      'One spec everywhere, no platform extras.',
    ],
  },
  async () => {
    await Fractal.Worker.provide(collab('api'), () =>
      Fractal.step(
        {
          id: 'api',
          timeout: '1d',
          goal: 'The API serves the shared schema.',
        },
        () => ci('api'),
      ),
    )
    // Platforms start together once the API passed
    await Promise.all(
      platforms.map(({ id, name }) =>
        Fractal.Worker.provide(collab(id), () =>
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
    // One scenario suite, run against every platform
    await Fractal.Worker.provide(collab('qa'), () =>
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
    // A person decides, a no stops the release
    await Fractal.step({ id: 'approve' }, async () => {
      const answer = await Fractal.ask({
        name: 'You approve the release',
        reviewer: ada,
        question: 'Ship comments on every platform?',
      })
      if (answer._tag === 'Rejected')
        throw new Declined()
    })
  },
)
