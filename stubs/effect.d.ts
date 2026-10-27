import type { Command } from '@effect/platform'
import type { Effect, Layer, Schema } from 'effect'

import type {
  Agent,
  Answer,
  AskOptions,
  GateOptions,
  Mission,
  MissionOptions,
  Person,
  ScheduleOptions,
  StepOptions,
  Turn,
} from './shared.js'

/** Typed design target only, not an executable Fractal SDK. */
export namespace Fractal {
  const ResourceRef: typeof Schema.String
  function agent(options: Agent): Agent
  function person(options: Person): Person
  interface Worker {
    readonly Worker: unique symbol
  }
  namespace Worker {
    function layer(agent: Agent): Layer.Layer<Worker>
  }
  interface Engine {
    readonly Engine: unique symbol
  }
  namespace Engine {
    const local: Layer.Layer<Engine>
  }
  namespace Harness {
    const local: Layer.Layer<never>
  }
  namespace Workspace {
    const local: Layer.Layer<never>
  }
  namespace Host {
    const local: Layer.Layer<never>
  }
  class TimedOut {
    readonly _tag: 'TimedOut'
  }
  function ask(
    options: AskOptions,
  ): Effect.Effect<Answer, TimedOut>
  function gate<TError = never, TContext = never>(
    options: GateOptions & {
      readonly exec?: Command.Command
      readonly check?: Effect.Effect<
        boolean,
        TError,
        TContext
      >
    },
  ): Effect.Effect<void, TError, TContext>
  function step(
    options: StepOptions,
  ): Effect.Effect<Turn, never, Worker>
  function step<TValue, TError, TContext>(
    options: StepOptions & {
      readonly agentless: true
    },
    body: Effect.Effect<TValue, TError, TContext>,
  ): Effect.Effect<TValue, TError, TContext>
  function step<TValue, TError, TContext>(
    options: StepOptions,
    body: Effect.Effect<TValue, TError, TContext>,
  ): Effect.Effect<TValue, TError, TContext | Worker>
  function step<TSuccess, TValue, TError, TContext>(
    options: StepOptions<TSuccess> & {
      readonly success: Schema.Schema<TSuccess>
    },
    body: Effect.Effect<TValue, TError, TContext>,
  ): Effect.Effect<TSuccess, TError, TContext | Worker>
  function mission<
    TPayload = void,
    TSuccess = void,
    TError = never,
    TContext = never,
  >(
    options: MissionOptions<TPayload, TSuccess>,
    body: (
      payload: TPayload,
    ) => Effect.Effect<TSuccess, TError, TContext>,
  ): Mission<TPayload, TSuccess>
  function schedule<TPayload, TSuccess>(
    options: ScheduleOptions<TPayload, TSuccess>,
  ): ScheduleOptions<TPayload, TSuccess>
  function run<TPayload, TSuccess>(
    mission: Mission<TPayload, TSuccess>,
    ...payload: TPayload extends void ? [] : [TPayload]
  ): Effect.Effect<TSuccess, never, Engine>
}
