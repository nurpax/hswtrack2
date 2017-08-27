
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
    id: id,
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
    id: id,
    receivedAt: Date.now()
  }
}


function queryParams(params) {
    return Object.keys(params)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
        .join('&')
}

// Same as fetchWithAuth but with the POST/DELETE parameters passed as www-
// form-urlencoded instead of JSON.
function fetchWithAuthUrlEncoded (dispatch, getState, url, params, cb) {
  const p = { ...params,
    headers: { ...params.headers, 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: qs.stringify(params.body)
  }
  return fetchWithAuth(dispatch, getState, url, p, cb)
}


export function fetchWeights (nDays) {
  return function (dispatch, getState) {
    let params = { days: nDays }
    return fetchWithAuth(dispatch, getState, '/rest/weight?'+queryParams(params), {}, function (json) {
      dispatch(receiveWeights(json))
    })
  }
}

export function saveWeight (w) {
  return function (dispatch, getState) {
    return fetchWithAuthUrlEncoded(dispatch, getState, '/rest/weight', {
      method: 'POST',
      body: { weight: w }
    }, function (json) {
      dispatch(receiveSaveWeight(json))
    })
  }
}

export function clearWeight (id) {
  return function (dispatch, getState) {
    return fetchWithAuthUrlEncoded(dispatch, getState, '/rest/weight', {
      method: 'DELETE',
      body: { id: id }
    }, function (json) {
      dispatch(receiveClearWeight(id, json))
    })
  }
}

export function fetchNotes (nDays) {
  return function (dispatch, getState) {
    return fetchWithAuth(dispatch, getState, '/rest/note', {}, function (json) {
      dispatch(receiveNotes(json))
    })
  }
}

export function addNote (text) {
  return function (dispatch, getState) {
    return fetchWithAuthUrlEncoded(dispatch, getState, '/rest/note', {
      method: 'POST',
      body: { text: text }
    }, function (json) {
      dispatch(receiveAddNote(json))
    })
  }
}

export function deleteNote (id) {
  return function (dispatch, getState) {
    return fetchWithAuthUrlEncoded(dispatch, getState, '/rest/note', {
      method: 'DELETE',
      body: { id: id }
    }, function (json) {
      dispatch(receiveDeleteNote(id, json))
    })
  }
}
