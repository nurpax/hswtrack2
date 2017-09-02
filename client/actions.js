
import * as c from './constants'
import { fetchWithAuth } from './auth'
import * as qs from 'qs'

export function setWeightDayLimit (nDays) {
  return {
    type: c.SET_WEIGHT_DAY_LIMIT,
    data: nDays
  }
}

function receiveWeights (json) {
  return {
    type: c.RECEIVE_WEIGHTS,
    data: json,
    receivedAt: Date.now()
  }
}

function receiveSaveWeight (json) {
  return {
    type: c.RECEIVE_SAVE_WEIGHT,
    data: json,
    receivedAt: Date.now()
  }
}

function receiveClearWeight (id, json) {
  return {
    type: c.RECEIVE_CLEAR_WEIGHT,
    data: json,
    id,
    receivedAt: Date.now()
  }
}

function receiveNotes (json) {
  return {
    type: c.RECEIVE_NOTES,
    data: json,
    receivedAt: Date.now()
  }
}

function receiveAddNote (json) {
  return {
    type: c.RECEIVE_ADD_NOTE,
    data: json,
    receivedAt: Date.now()
  }
}

function receiveDeleteNote (id, json) {
  return {
    type: c.RECEIVE_DELETE_NOTE,
    data: json,
    id,
    receivedAt: Date.now()
  }
}

function receiveExercises (json) {
  return {
    type: c.RECEIVE_EXERCISES,
    data: json,
    receivedAt: Date.now()
  }
}

function receiveAddExercise (json) {
  return {
    type: c.RECEIVE_ADD_EXERCISE,
    data: json,
    receivedAt: Date.now()
  }
}

function receiveWorkouts (json) {
  return {
    type: c.RECEIVE_WORKOUTS,
    data: json,
    receivedAt: Date.now()
  }
}

function receiveWorkout (json) {
  return {
    type: c.RECEIVE_WORKOUT,
    data: json,
    receivedAt: Date.now()
  }
}

function receiveAddWorkout (json) {
  return {
    type: c.RECEIVE_ADD_WORKOUT,
    data: json,
    receivedAt: Date.now()
  }
}

function receiveDeleteSet (workoutId, id, json) {
  return {
    type: c.RECEIVE_DELETE_SET,
    data: json,
    workoutId,
    id,
    receivedAt: Date.now()
  }
}


function queryParams(params) {
    return Object.keys(params)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
        .join('&')
}

function formRequestDispatch (method, url, params, action) {
  const p = {
    method: method,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: qs.stringify(params)
  }
  return function (dispatch, getState) {
    return fetchWithAuth(dispatch, getState, url, p, function (json) {
      dispatch(action(json))
    })
  }
}

function getDispatch (url, params, action) {
  return function (dispatch, getState) {
    return fetchWithAuth(dispatch, getState, url + '?' + queryParams(params), {}, function (json) {
      dispatch(action(json))
    })
  }
}

function postDispatch(url, params, action) {
  return formRequestDispatch('POST', url, params, action)
}

function deleteDispatch(url, params, action) {
  return formRequestDispatch('DELETE', url, params, action)
}

export function fetchWeights (nDays) {
  return getDispatch('/rest/weight', { days: nDays }, receiveWeights)
}

export function saveWeight (w) {
  return postDispatch('/rest/weight', { weight: w }, receiveSaveWeight)
}

export function clearWeight (id) {
  return deleteDispatch('/rest/weight', { id }, json => receiveClearWeight(id, json))
}

export function fetchNotes () {
  return getDispatch('/rest/note', {}, receiveNotes)
}

export function addNote (text) {
  return postDispatch('/rest/note', { text }, receiveAddNote)
}

export function deleteNote (id) {
  return deleteDispatch('/rest/note', { id }, json => receiveDeleteNote(id, json))
}

export function fetchExercises () {
  return getDispatch('/rest/exercise', {}, receiveExercises)
}

export function addExercise (exercise) {
  return postDispatch('/rest/exercise', exercise, receiveAddExercise)
}

export function fetchWorkouts () {
  return getDispatch('/rest/workout', {}, receiveWorkouts)
}

export function fetchWorkoutById (id) {
  return getDispatch('/rest/workout', { id }, receiveWorkout)
}

export function newWorkout () {
  return postDispatch('/rest/workout', {}, receiveAddWorkout)
}

export function deleteSet (workoutId, id) {
  return deleteDispatch('/rest/workout/exercise', { id }, json => receiveDeleteSet(workoutId, id, json))
}
