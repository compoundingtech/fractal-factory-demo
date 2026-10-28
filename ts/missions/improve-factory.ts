// Failed runs and waits for you reveal problems.
// An analyst and editor test one factory change.
// You approve it before it is applied.

import {
  you,
  runAnalyst,
  factoryEditor,
} from '#agents/improve-factory'
import { Fractal } from 'fractal'

class Declined extends Error {}

/** Test and apply one factory improvement. */
export default Fractal.mission(
  {
    id: 'improve-factory',
    state: 'ready',
    timeout: '2d',
    reportTo: factoryEditor,
    goal: "The week's worst friction is gone.",
    constraints: [
      'Only edit declarations. Keep every gate.',
    ],
  },
  async () => {
    // Use failures and wait times to choose one change
    await Promise.all([
      Fractal.Worker.provide(runAnalyst, () =>
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
      Fractal.Worker.provide(factoryEditor, () =>
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
    // Replay failed runs to test the proposed change
    await Fractal.Worker.provide(factoryEditor, () =>
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
    // Wait for your approval before applying changes
    await Fractal.step({ id: 'approve' }, async () => {
      const answer = await Fractal.ask({
        name: 'You approve the change',
        reviewer: you,
        question: 'Apply the improved declarations?',
      })
      if (answer._tag === 'Rejected')
        throw new Declined()
    })
    await Fractal.Worker.provide(factoryEditor, () =>
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
