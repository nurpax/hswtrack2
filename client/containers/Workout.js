import ReactDOM from 'react-dom'
import React, { Component } from 'react'
import * as d3 from "d3"
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { getUser } from '../auth'
import * as actions from '../actions'
import { Row, Columns } from '../components/helpers'
import Layout from '../components/Layout'
import s from './Workout.scss'

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

class WorkoutListComponent extends Component {
  static mapDispatchToProps = (dispatch) => {
    return {
      loadWorkouts: (e) => dispatch(actions.fetchWorkouts()),
      newWorkout: () => dispatch(actions.newWorkout())
    }
  }

  static mapStateToProps = (state) => {
    return {
      workouts: state.workouts
    }
  }

  componentDidMount () {
    this.props.loadWorkouts()
  }

  newWorkout = () => {
    this.props.newWorkout()
  }

  render () {
    const workouts = this.props.workouts.map(w => <li><WorkoutTitle workout={w} /></li>)
    return (
      <div>
        <h2>Today's workouts</h2>
        <ul className={s.unstyled}>
          {workouts}
        </ul>
        <button className='button-primary' onClick={this.newWorkout}>Add a Workout</button>
      </div>
    )
  }
}

const WorkoutList = connect(
  WorkoutListComponent.mapStateToProps,
  WorkoutListComponent.mapDispatchToProps)(WorkoutListComponent)


const mapDispatchToProps = (dispatch) => {
  return {
  }
}

function mapStateToProps (state) {
  return {
    user: getUser(state)
  }
}

const Workout = function (props) {
  return (
    <Layout user={props.user}>
      <div>
        <WorkoutList />
        <Link to='/exercises'>Edit exercises</Link>
      </div>
    </Layout>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(Workout)
