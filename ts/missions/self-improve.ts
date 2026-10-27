import {
  ada,
  analyst,
  steward,
} from '#agents/self-improve'
import { Fractal } from 'fractal'

class Declined extends Error {}

/** Remove the week's worst factory friction. */
export default Fractal.mission(
  {
    id: 'factory/self-improve',
    state: 'ready',
    timeout: '2d',
    reportTo: steward,
    goal: "The week's worst friction is gone.",
    constraints: [
      'Only edit declarations. Keep every gate.',
    ],
  },
  async () => {
    await Promise.all([
      Fractal.Worker.provide(analyst, () =>
        Fractal.step(
          {
            id: 'failures',
            timeout: '30m',
            goal: 'List failed runs, stuck gates.',
          },
          () =>
            Fractal.gate({
              name: 'failures published',
              document: 'doc/factory/failures',
            }),
        ),
      ),
      Fractal.Worker.provide(steward, () =>
        Fractal.step(
          {
            id: 'asks',
            timeout: '30m',
            goal: 'List asks and their wait times.',
          },
          () =>
            Fractal.gate({
              name: 'asks published',
              document: 'doc/factory/asks',
            }),
        ),
      ),
    ])
    // The change must replay last week's failures
    await Fractal.Worker.provide(steward, () =>
      Fractal.step(
        {
          id: 'propose',
          timeout: '2h',
          goal: 'One PR changes one declaration.',
        },
        () =>
          Fractal.gate({
            name: 'the replays pass',
            exec: [
              './scripts/replay.sh',
              'doc/factory/failures',
            ],
            timeout: '30m',
          }),
      ),
    )
    // Only a yes goes on, a no ends the mission
    await Fractal.step(
      { id: 'approve', agentless: true },
      async () => {
        const answer = await Fractal.ask({
          name: 'You approve the change',
          reviewer: ada,
          question: 'Apply the improved declarations?',
        })
        if (answer._tag === 'Rejected')
          throw new Declined()
      },
    )
    await Fractal.Worker.provide(steward, () =>
      Fractal.step(
        {
          id: 'apply',
          timeout: '30m',
          goal: 'Merge it, then run fractal apply.',
        },
        () =>
          Fractal.gate({
            name: 'CI passed on main',
            ciPassed: {
              check: 'ci',
              repo: 'acme/factory',
              branch: 'main',
            },
          }),
      ),
    )
  },
)
