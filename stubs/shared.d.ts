import type { Schema } from 'effect'

/** Identity declared in the graph, not a running seat. */
export interface Person {
  readonly id: string
}
/** Agent launch and placement declaration. */
export interface Agent extends Person {
  readonly lifecycle: 'standing' | 'bounded'
  readonly host: string
  readonly workspace: string
  readonly harness: {
    readonly kind: string
    readonly model: string
    readonly effort?: string
  }
  readonly under?: {
    readonly agent: Agent
    readonly reason: string
  }
}
/** A completed worker turn, including measured token usage. */
export interface Turn {
  readonly tokens: number
}
/** Metadata shared by missions and durable steps. */
export interface StepOptions<TSuccess = void> {
  readonly id: string
  readonly timeout?: string
  readonly goal?: string
  readonly success?: Schema.Schema<TSuccess>
}
/** Mission metadata, with payload and success checked by Schema. */
export interface MissionOptions<
  TPayload,
  TSuccess,
> extends StepOptions<TSuccess> {
  readonly state: 'ready'
  readonly reportTo: Person
  readonly constraints?: readonly string[]
  readonly payload?: Schema.Schema<TPayload>
}
/** A declared mission carries its decoded input and output types. */
export interface Mission<
  TPayload = void,
  TSuccess = void,
> {
  readonly input: TPayload
  readonly output: TSuccess
}
/** Schedule references the mission value rather than a mutable name. */
export interface ScheduleOptions<TPayload, TSuccess> {
  readonly id: string
  readonly every: string
  readonly anchor: string
  readonly catchUp: 'latest'
  readonly work: {
    readonly mission: Mission<TPayload, TSuccess>
    readonly workspace: string
  }
}
/** Human decision, separate from timeout failure. */
export type Answer =
  | { readonly _tag: 'Approved' }
  | { readonly _tag: 'Rejected' }
/** Human gate metadata. */
export interface AskOptions {
  readonly name: string
  readonly reviewer: Person
  readonly question: string
  readonly timeout?: string
}
/** Common gate evidence selectors. */
export interface GateOptions {
  readonly name: string
  readonly timeout?: string
  readonly ciPassed?: {
    readonly check: string
    readonly repo: string
    readonly branch: string
  }
  readonly document?: string
  readonly llm?: {
    readonly model: string
    readonly tools: readonly string[]
    readonly tokenBudget: number
    readonly timeLimit: string
    readonly prompt: string
  }
}
