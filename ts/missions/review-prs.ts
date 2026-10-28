// A pull request is ready for review.
// A tester and reviewer gather the evidence.
// You decide whether to sign off the review.

import {
  you,
  prReviewer,
  prTester,
} from '#agents/review-prs'
import { Fractal } from 'fractal'

class Unsigned extends Error {}

/** Review a pull request with evidence. */
export default Fractal.mission(
  {
    id: 'review-prs',
    state: 'ready',
    timeout: '2h',
    reportTo: prReviewer,
    goal: 'The PR has an evidence-backed review.',
    constraints: [
      'Review only. Never approve or merge.',
    ],
    // Use the pull request that triggered this run
    payload: { source: Fractal.ResourceRef },
  },
  async ({ source }) => {
    // Gather test results and context at the same time
    await Promise.all([
      Fractal.Worker.provide(prTester, () =>
        Fractal.step({
          id: 'reproduce',
          timeout: '20m',
          goal: `Run the tests of ${source}.`,
        }),
      ),
      Fractal.Worker.provide(prReviewer, () =>
        Fractal.step({
          id: 'context',
          timeout: '15m',
          goal: `Find the issues behind ${source}.`,
        }),
      ),
    ])
    // Back the review with test results and context
    await Fractal.Worker.provide(prReviewer, () =>
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
            reviewer: you,
            question: 'Is this review ready to share?',
            timeout: '30m',
          })
          // Require your approval before signing off
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
