import type { Effect, Layer, Stream } from 'effect'
/** GitHub provider types for the Effect examples. */
export declare namespace GitHub {
  const Default: Layer.Layer<never>
  function issues(query: {
    repo: string
    label: string
    state: 'open'
  }): Stream.Stream<{ readonly number: number }>
  function issue(query: {
    repo: string
    number: number
  }): Effect.Effect<{
    readonly state: 'open' | 'closed'
  }>
  function checkRun(query: {
    repo: string
    ref: string
    name: string
  }): Effect.Effect<{
    readonly conclusion:
      | 'success'
      | 'failure'
      | 'pending'
  }>
}
