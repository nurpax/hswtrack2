
import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'

import * as c from './constants'
import * as auth from './auth'

function receiveWeights (state = {}, action) {
  switch (action.type) {
    case c.RECEIVE_WEIGHTS:
      return action.data
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
  weight: receiveWeights,
  weightui: reduceWeightUiState,
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
