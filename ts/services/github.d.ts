/** GitHub provider types for the async examples. */
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
