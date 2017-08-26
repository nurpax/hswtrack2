
import * as c from './constants'
import { fetchWithAuth } from './auth'

// Todo handling
function receiveWeights (json) {
  return {
    type: c.RECEIVE_WEIGHTS,
    data: json,
    receivedAt: Date.now()
  }
}

function queryParams(params) {
    return Object.keys(params)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
        .join('&')
}

function toFormData (o) {
  let formData = new FormData()

  for (var prop in o) {
    if (o.hasOwnProperty(prop)) {
      formData.append(prop, o[prop])
    }
  }
  return formData
}

export function fetchWeights (nDays) {
  return function (dispatch, getState) {
    let params = { days: nDays }
    return fetchWithAuth(dispatch, getState, '/rest/weight?'+queryParams(params), {}, function (json) {
      dispatch(receiveWeights(json))
    })
  }
}
