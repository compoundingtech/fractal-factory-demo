import {
  contender,
  reporter,
} from '#agents/eval-flaky-test'
import { Command } from '@effect/platform'
import { Effect, Schema } from 'effect'
import { Fractal } from 'fractal/effect'

const setups = [
  'codex',
  'claude',
  'candidate',
] as const

// The run returns this, decoded and checked
const Report = Schema.Struct({
  ranking: Schema.Array(Schema.Literal(...setups)),
  summary: Schema.String,
})

/** Score agent setups on the same flaky test. */
export default Fractal.mission(
  {
    id: 'eval/flaky-test',
    state: 'ready',
    timeout: '20 minutes',
    reportTo: reporter,
    goal: "One report compares every setup's fix.",
    constraints: [
      'Never disable harness features to pass.',
    ],
    success: Report,
  },
  () =>
    Effect.gen(function* () {
      // The same task once per setup, the suite judges
      yield* Effect.forEach(
        setups,
        (setup) =>
          Fractal.step(
            {
              id: setup,
              timeout: '10 minutes',
              goal: 'Fix the flaky test in acme/app.',
            },
            Fractal.gate({
              name: 'the suite passes',
              exec: Command.make('pnpm', 'test'),
              timeout: '5 minutes',
            }),
          ).pipe(
            Effect.provide(
              Fractal.Worker.layer(contender(setup)),
            ),
          ),
        { concurrency: 'unbounded' },
      )
      return yield* Fractal.step(
        {
          id: 'compare',
          timeout: '5 minutes',
          goal: 'Compare the diffs and test runs.',
          success: Report,
        },
        Effect.all([
          Fractal.gate({
            name: 'report published',
            document: 'doc/eval/flaky-test/report',
          }),
          // A model checks the report is fair
          Fractal.gate({
            name: 'the report is fair',
            llm: {
              model: 'gpt-5.6-sol',
              tools: ['shell', 'git'],
              tokenBudget: 20_000,
              timeLimit: '4 minutes',
              prompt:
                'Is the report fair to each diff?',
            },
          }),
        ]),
      ).pipe(
        Effect.provide(Fractal.Worker.layer(reporter)),
      )
    }),
)
