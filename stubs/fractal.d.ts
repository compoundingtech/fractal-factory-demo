import type { Schema } from 'effect'

import type {
  Agent,
  Answer,
  AskOptions,
  GateOptions,
  Mission,
  Person,
  ScheduleOptions,
  StepOptions,
  Turn,
} from './shared.js'

/** Async/await projection of the same typed design target. */
export namespace Fractal {
  const ResourceRef: typeof Schema.String
  function agent(options: Agent): Agent
  function person(options: Person): Person
  namespace Worker {
    function provide<TValue>(
      agent: Agent,
      body: () => Promise<TValue>,
    ): Promise<TValue>
  }
  interface Runtime {
    readonly engine: object
    readonly harness: object
    readonly workspace: object
    readonly host: object
  }
  namespace Engine {
    function local(): object
  }
  namespace Harness {
    function local(): object
  }
  namespace Workspace {
    function local(): object
  }
  namespace Host {
    function local(): object
  }
  function runtime(options: Runtime): Runtime
  class TimedOut extends Error {
    readonly _tag: 'TimedOut'
  }
  function ask(options: AskOptions): Promise<Answer>
  function gate(
    options: GateOptions & {
      readonly exec?: readonly string[]
      readonly check?: () => Promise<boolean>
    },
  ): Promise<void>
  function step(options: StepOptions): Promise<Turn>
  function step<TValue>(
    options: StepOptions,
    body: () => Promise<TValue>,
  ): Promise<TValue>
  function step<TSuccess, TValue>(
    options: StepOptions<TSuccess> & {
      readonly success: Schema.Schema<TSuccess>
    },
    body: () => Promise<TValue>,
  ): Promise<TSuccess>
  function mission<
    TPayload extends Schema.Struct.Fields = {},
    TSuccess = void,
  >(
    options: {
      readonly id: string
      readonly state: 'ready'
      readonly timeout: string
      readonly reportTo: Person
      readonly goal: string
      readonly constraints?: readonly string[]
      readonly payload?: TPayload
      readonly success?: Schema.Schema<TSuccess>
    },
    body: (
      payload: Schema.Struct.Type<TPayload>,
    ) => Promise<TSuccess>,
  ): Mission<Schema.Struct.Type<TPayload>, TSuccess>
  function schedule<TPayload, TSuccess>(
    options: ScheduleOptions<TPayload, TSuccess>,
  ): ScheduleOptions<TPayload, TSuccess>
  function run<TPayload, TSuccess>(
    mission: Mission<TPayload, TSuccess>,
    options: {
      readonly runtime: Runtime
      readonly payload?: TPayload
    },
  ): Promise<TSuccess>
}
