import React from 'react'
import s from './WorkoutTitle.scss'
import { Link } from 'react-router-dom'

function dateString (v) {
  if (!v)
    return null
  return (new Date(v)).toLocaleString()
}

const WorkoutTitle = ({ workout }) => {
  const url = "/workout/"+workout.id
  const timestamp = dateString(workout.time)
  const pub = workout.public ? <small className={s.public}>[public]</small> : null
  return (
    <h4><Link to={url}>Workout {workout.id}</Link> <small>{timestamp}</small> {pub}</h4>
  )
}

export default WorkoutTitle
