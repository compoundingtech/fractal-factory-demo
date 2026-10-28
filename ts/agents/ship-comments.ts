import { Fractal } from 'fractal'

const roles = {
  // Builds the shared comments API
  api: 'api-dev',
  // Builds comments for the web
  web: 'web-dev',
  // Builds comments for iOS
  ios: 'ios-dev',
  // Builds comments for Android
  android: 'android-dev',
  // Checks that comments work on every platform
  qa: 'qa-tester',
} as const

/** Creates the developer or tester for each part. */
export const developer = (part: keyof typeof roles) =>
  Fractal.agent({
    id: roles[part],
    lifecycle: 'standing',
    host: 'local',
    workspace: '/work/app',
    harness: {
      kind: 'codex',
      model: 'gpt-5.6-sol',
      effort: 'high',
    },
  })

/** You decide whether to release. */
export const you = Fractal.person({ id: 'you' })
