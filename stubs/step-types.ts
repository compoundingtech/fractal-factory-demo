import { Effect } from 'effect'
import { Fractal } from 'fractal/effect'

import type { StepOptions } from './shared.js'

// Body-only work keeps its requirements without adding a worker
const inspect = Fractal.step(
  { id: 'inspect' },
  Effect.succeed(true),
)
const approve = Fractal.step(
  { id: 'approve' },
  Effect.gen(function* () {
    yield* Fractal.gate({ name: 'checks pass' })
    return yield* Fractal.ask({
      name: 'Approve the change',
      reviewer: { id: 'ada' },
      question: 'Ship it?',
    })
  }),
)
const work = Fractal.step({ id: 'work' })
const nestedWork = Fractal.step({ id: 'parent' }, work)

type Equal<TLeft, TRight> =
  (<T>() => T extends TLeft ? 1 : 2) extends <
    T,
  >() => T extends TRight ? 1 : 2
    ? true
    : false
type Assert<TValue extends true> = TValue

/** Provider-only steps do not require a worker. */
export type InspectNeedsNoWorker = Assert<
  Equal<Effect.Effect.Context<typeof inspect>, never>
>
/** Gates and human approvals do not require a worker. */
export type ApprovalNeedsNoWorker = Assert<
  Equal<Effect.Effect.Context<typeof approve>, never>
>
/** A worker turn requires a worker. */
export type WorkNeedsWorker = Assert<
  Equal<
    Effect.Effect.Context<typeof work>,
    Fractal.Worker
  >
>
/** Wrapping worker code preserves its requirement. */
export type NestedWorkNeedsWorker = Assert<
  Equal<
    Effect.Effect.Context<typeof nestedWork>,
    Fractal.Worker
  >
>
/** Step metadata does not expose an agentless flag. */
export type NoAgentlessOption = Assert<
  Equal<Extract<keyof StepOptions, 'agentless'>, never>
>
