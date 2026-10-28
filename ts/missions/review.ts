import { ada, reviewer, tester } from '#agents/review'
import { Fractal } from 'fractal'

class Unsigned extends Error {}

/** Review each new pull request with evidence. */
export default Fractal.mission(
  {
    id: 'github/review',
    state: 'ready',
    timeout: '2h',
    reportTo: reviewer,
    goal: 'The PR has an evidence-backed review.',
    constraints: [
      'Review only. Never approve or merge.',
    ],
    // The subscription passes the pull request it saw
    payload: { source: Fractal.ResourceRef },
  },
  async ({ source }) => {
    // Tests and context run side by side
    await Promise.all([
      Fractal.Worker.provide(tester, () =>
        Fractal.step({
          id: 'reproduce',
          timeout: '20m',
          goal: `Run the tests of ${source}.`,
        }),
      ),
      Fractal.Worker.provide(reviewer, () =>
        Fractal.step({
          id: 'context',
          timeout: '15m',
          goal: `Find the issues behind ${source}.`,
        }),
      ),
    ])
    await Fractal.Worker.provide(reviewer, () =>
      Fractal.step(
        {
          id: 'review',
          timeout: '30m',
          goal: 'Publish findings with evidence.',
        },
        () =>
          Fractal.gate({
            name: 'review published',
            document: 'doc/github/review',
          }),
      ),
    )
    await Fractal.step(
      { id: 'sign-off' },
      async () => {
        try {
          const answer = await Fractal.ask({
            name: 'You sign off the review',
            reviewer: ada,
            question: 'Is this review ready to share?',
            timeout: '30m',
          })
          // A no or a timeout leaves it unsigned
          if (answer._tag === 'Rejected')
            throw new Unsigned()
        } catch (error) {
          if (error instanceof Fractal.TimedOut)
            throw new Unsigned()
          throw error
        }
      },
    )
  },
)
