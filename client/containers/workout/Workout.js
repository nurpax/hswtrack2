import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { getUser } from '../../auth'
import { getWorkoutsForToday } from '../../selectors'
import * as actions from '../../actions'
import Layout from '../../components/Layout'
import WorkoutTitle from '../../components/workout/WorkoutTitle'
import s from './Workout.scss'

class WorkoutListComponent extends Component {
  static mapDispatchToProps = (dispatch) => {
    return {
      loadWorkouts: (e) => dispatch(actions.fetchWorkouts()),
      newWorkout: () => dispatch(actions.newWorkout())
    }
  }

  static mapStateToProps = (state) => {
    return {
      workouts: getWorkoutsForToday(state)

    }
  }

  componentDidMount () {
    this.props.loadWorkouts()
  }

  newWorkout = () => {
    this.props.newWorkout()
  }

  render () {
    const workouts = this.props.workouts.map(w => <li key={w.id}><WorkoutTitle workout={w} /></li>)
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
      <WorkoutList />
      <Link to='/stats'>Workout history</Link>
    </Layout>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(Workout)
