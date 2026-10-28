import updateDeps from '#missions/update-deps'
import { Fractal } from 'fractal/effect'

/** Start dependency updates every Monday. */
export default Fractal.schedule({
  id: 'update-deps',
  every: '1 week',
  anchor: '2026-10-26T07:00:00Z',
  // After downtime, run only the latest missed week
  catchUp: 'latest',
  // Use the latest published mission when it is ready
  // Use an older revision only when pinned
  work: {
    mission: updateDeps,
    workspace: '/work/factory',
  },
})
