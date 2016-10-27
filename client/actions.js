/* eslint camelcase: 0 */

import fetch from 'isomorphic-fetch'
import jwt_decode from 'jwt-decode'

export const NOTIFY_SET = 'NOTIFY_SET'
export const NOTIFY_DISMISS = 'NOTIFY_DISMISS'

export const SET_FILTER = 'SET_FILTER'
export const USER_LOGGED_IN = 'USER_LOGGED_IN'
export const USER_LOGGED_OUT = 'USER_LOGGED_OUT'

export const REQUEST_TODO_LIST = 'REQUEST_TODO_LIST'
export const RECEIVE_TODO_LIST = 'RECEIVE_TODO_LIST'

export const RECEIVE_TODO = 'RECEIVE_TODO'

function checkLogin (dispatch, response, doLogin) {
  // Handle bad login
  if (response.status === 200) {
    return response.json().then(doLogin)
  } else if (response.status === 401) {
    return response.json().then(function (err) {
      dispatch(setNotification(err.error))
    })
  }
  // TODO throw unknown error here
}

function setJwt (dispatch, token) {
  let tok = jwt_decode(token)
  // Keep the original jwt token for sending it back to the server in
  // fetch headers
  tok.token = token
  localStorage.setItem('token', JSON.stringify(tok))
  dispatch({
    type: USER_LOGGED_IN,
    payload: tok
  })
}

export function login (login, pass) {
  return function (dispatch) {
    function doLogin (json) {
      setJwt(dispatch, json.token)
    }
    return fetch('/api/login', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({login, pass})
    })
    .then(response => checkLogin(dispatch, response, doLogin))
    .catch(function (error) {
      console.log('request failed', error)
    })
  }
}

export function signUp (login, pass) {
  return function (dispatch) {
    function doSignUp (json) {
      setJwt(dispatch, json.token)
    }
    return fetch('/api/login/new', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({login, pass})
    })
    .then(response => checkLogin(dispatch, response, doSignUp))
    .catch(function (error) {
      console.log('request failed', error)
    })
  }
}

export function logout () {
  localStorage.removeItem('token')
  return {
    type: USER_LOGGED_OUT
  }
}

// Todo handling
function receiveTodos (json) {
  return {
    type: RECEIVE_TODO_LIST,
    data: json,
    receivedAt: Date.now()
  }
}

function receiveTodo (json) {
  return {
    type: RECEIVE_TODO,
    data: json,
    receivedAt: Date.now()
  }
}

export function fetchTodos () {
  return function (dispatch, getState) {
    return fetch('/api/todo', { headers: {'Authorization': 'Bearer ' + getState().user.token} })
      .then(response => response.json())
      .then(json =>
        dispatch(receiveTodos(json))
      )
  }
}

export function saveTodo (todo) {
  return function (dispatch, getState) {
    return fetch('/api/todo', {
      method: 'POST',
      headers: {'Authorization': 'Bearer ' + getState().user.token},
      body: JSON.stringify(todo)
    })
    .then(response => response.json())
    .then(json =>
      dispatch(receiveTodo(json))
    )
  }
}

export function setFilter (filter) {
  return {
    type: SET_FILTER,
    data: filter
  }
}

export function setNotification (msg) {
  return dispatch => {
    dispatch({ type: NOTIFY_SET, data: msg })
    setTimeout(() => {
      dispatch({
        type: NOTIFY_DISMISS,
        data: null
      })
    }, 5000)
  }
}
