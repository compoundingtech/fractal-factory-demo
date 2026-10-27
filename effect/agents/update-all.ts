import { Fractal } from 'fractal/effect'

/** A standing maintainer per repo, in its checkout. */
export const maintainer = (repo: string) =>
  Fractal.agent({
    id: `${repo}/maintainer`,
    lifecycle: 'standing',
    host: 'local',
    workspace: `/work/${repo}`,
    // Version bumps need little reasoning
    harness: {
      kind: 'codex',
      model: 'gpt-5.6-sol',
      effort: 'medium',
    },
  })
