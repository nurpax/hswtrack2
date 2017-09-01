
import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'

import * as c from './constants'
import * as auth from './auth'

function reduceWeights (state = {}, action) {
  switch (action.type) {
    case c.RECEIVE_WEIGHTS:
      return action.data
    case c.RECEIVE_SAVE_WEIGHT:
      return {
        ...state,
        today: action.data,
        weights: state.weights.concat(action.data)
      }
    case c.RECEIVE_CLEAR_WEIGHT:
      return {
        ...state,
        today: null,
        weights: state.weights.filter(w => w.id != action.id)
      }
    default:
      return state
  }
}

function reduceNotes (state = [], action) {
  switch (action.type) {
    case c.RECEIVE_NOTES:
      return action.data
    case c.RECEIVE_ADD_NOTE:
      return state.concat(action.data)
    case c.RECEIVE_DELETE_NOTE:
      return state.filter(n => n.id != action.id)
    default:
      return state
  }
}

function reduceExercises (state = [], action) {
  switch (action.type) {
    case c.RECEIVE_EXERCISES:
      return action.data
    case c.RECEIVE_ADD_EXERCISE:
      return state.concat(action.data)
    default:
      return state
  }
}

function reduceWorkouts (state = [], action) {
  switch (action.type) {
    case c.RECEIVE_WORKOUTS:
      return action.data
    case c.RECEIVE_ADD_WORKOUT:
      return state.concat(action.data)
    default:
      return state
  }
}

function reduceWeightUiState (state = { dayLimit: 90 }, action) {
  switch (action.type) {
    case c.SET_WEIGHT_DAY_LIMIT:
      return { ...state, dayLimit: action.data }
    default:
      return state
  }
}

const appReducer = combineReducers({
  auth: auth.authReducer,
  routing: routerReducer,
  weight: reduceWeights,
  weightNotes: reduceNotes,
  weightui: reduceWeightUiState,
  exercises: reduceExercises,
  workouts: reduceWorkouts,
})

const rootReducer = (state, action) => {
  // Reset redux state if the user logged out.
  //
  // This state reset is required.  Otherwise logging in as user X, logging
  // out and logging in as user Y will show user Y data from the previously
  // logged in user X.
  if (action.type === auth.USER_LOGGED_OUT) {
    state = undefined
  }
  return appReducer(state, action)
}

export default rootReducer
