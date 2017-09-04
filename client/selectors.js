
import { createSelector } from 'reselect'

const getExercises = (state) => state.exercises
const getWorkouts = (state, props) => state.workouts.byId
const getTodayWorkoutIds = (state, props) => state.workouts.todayIds
const getRouteWorkoutId = (state, props) => props.match.params.id

function findById(map, id) {
  if (id in map) {
    return map[id]
  }
  return null
}

const getWorkoutFromRoute = createSelector(
  [ getRouteWorkoutId, getWorkouts ],
  (id, workouts) => {
    return findById(workouts, id)
  }
)

const getWorkoutsForToday = createSelector(
  [ getTodayWorkoutIds, getWorkouts ],
  (ids, workouts) => {
    return ids.map(id => findById(workouts, id))
  }
)

const getExerciseTypes = createSelector(
  [ getExercises ],
  (exercises) => {
    return exercises
  }
)

export { getWorkoutsForToday, getWorkoutFromRoute, getExerciseTypes }
