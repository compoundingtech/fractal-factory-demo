import { Fractal } from 'fractal'

/** Opens and tests updates for app, api or docs. */
export const depsBot = (
  repo: 'app' | 'api' | 'docs',
) =>
  Fractal.agent({
    id: `${repo}-deps-bot`,
    lifecycle: 'standing',
    host: 'local',
    workspace: `/work/${repo}`,
    harness: {
      kind: 'codex',
      model: 'gpt-5.6-sol',
      effort: 'medium',
    },
  })
