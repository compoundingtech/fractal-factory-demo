/** Async provider design target used by the examples. */
export declare const github: {
  issues(query: {
    repo: string
    label: string
    state: 'open'
  }): AsyncIterable<{ readonly number: number }>
  issue(query: {
    repo: string
    number: number
  }): Promise<{ readonly state: 'open' | 'closed' }>
  checkRun(query: {
    repo: string
    ref: string
    name: string
  }): Promise<{
    readonly conclusion:
      | 'success'
      | 'failure'
      | 'pending'
  }>
}
