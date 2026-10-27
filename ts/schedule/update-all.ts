import updateAll from '#missions/update-all'
import { Fractal } from 'fractal'

/** Start update-all every Monday morning. */
export default Fractal.schedule({
  id: 'deps/weekly',
  every: '7d',
  anchor: '2026-10-26T07:00:00Z',
  // After downtime, run once, not once per missed week
  catchUp: 'latest',
  // Runs the current published head if ready,
  // never an older revision, unless pinned
  work: {
    mission: updateAll,
    workspace: '/work/factory',
  },
})
