// A flaky test needs a reliable repair.
// Three setups try the same task and tests.
// A judge checks the ranked comparison report.

import {
  contender,
  evalJudge,
} from '#agents/eval-flaky-test'
import { Schema } from 'effect'
import { Fractal } from 'fractal'

const setups = [
  'codex',
  'claude',
  'candidate',
] as const

// Check the report shape before returning it
const Report = Schema.Struct({
  ranking: Schema.Array(Schema.Literal(...setups)),
  summary: Schema.String,
})

/** Compare repairs for the same flaky test. */
export default Fractal.mission(
  {
    id: 'eval-flaky-test',
    state: 'ready',
    timeout: '20m',
    reportTo: evalJudge,
    goal: "One report compares every setup's fix.",
    constraints: [
      'Never disable harness features to pass.',
    ],
    success: Report,
  },
  async () => {
    // Use the same task and tests for a fair
    // comparison
    await Promise.all(
      setups.map((setup) =>
        Fractal.Worker.provide(contender(setup), () =>
          Fractal.step(
            {
              id: setup,
              timeout: '10m',
              goal: 'Fix the flaky test in acme/app.',
            },
            () =>
              Fractal.gate({
                name: 'the suite passes',
                exec: ['pnpm', 'test'],
                timeout: '5m',
              }),
          ),
        ),
      ),
    )
    return Fractal.Worker.provide(evalJudge, () =>
      Fractal.step(
        {
          id: 'compare',
          timeout: '5m',
          goal: 'Compare the diffs and test runs.',
          success: Report,
        },
        () =>
          Promise.all([
            Fractal.gate({
              name: 'report published',
              document: 'doc/eval/flaky-test/report',
            }),
            // Check that the comparison treats each
            // fix fairly
            Fractal.gate({
              name: 'the report is fair',
              llm: {
                model: 'gpt-5.6-sol',
                tools: ['shell', 'git'],
                tokenBudget: 20_000,
                timeLimit: '4m',
                prompt:
                  'Is the report fair to each diff?',
              },
            }),
          ]),
      ),
    )
  },
)
