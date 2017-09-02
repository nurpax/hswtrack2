import React, { Component } from 'react'
import { connect } from 'react-redux'
import { getUser } from '../../auth'
import * as actions from '../../actions'
import { getWorkoutFromRoute } from '../../selectors'
import Layout from '../../components/Layout'
import WorkoutTitle from '../../components/workout/WorkoutTitle'

import s from './WorkoutDetails.scss'

class Set extends Component {
  handleDeleteSet = (e) => {
    const { id, reps, weight } = this.props.set
    const type = this.props.type
    e.preventDefault()
    let msg
    if (type == 'W') {
      msg = reps + ' x ' + weight + ' kg'
    } else if (type == 'BW') {
      msg = reps + ' reps (+ ' + weight + ' kg)'
    } else if (type == 'T') {
      msg = weight + ' seconds'
    }
    if (!confirm(msg + '\n\nOK to delete set?'))
      return
    this.props.deleteSet(id)
  }

  render () {
    const { weight, reps } = this.props.set
    const readonly = this.props.readonly
    const type = this.props.type

    var rmSet = readonly ?
      null :
      <td>
        <a onClick={this.handleDeleteSet} href='#'>&times;</a>
      </td>
    if (type == 'BW') {
      return (
        <tr>
          <td>Set:</td>
          <td className={s.textRight}>{reps}</td>
          <td>reps</td>
          <td>{weight ? '(+'+weight+' kg)' : '' }</td>
          {rmSet}
        </tr>
      )
    } else if (type == 'W') {
      return (
        <tr>
          <td>Set:</td>
          <td className={s.textRight}>{reps}</td>
          <td>&times;</td>
          <td>{weight} kg</td>
          {rmSet}
        </tr>
      )
    } else if (type == 'T') {
      return (
        <tr>
          <td>Set:</td>
          <td />
          <td />
          <td>{weight} seconds</td>
          {rmSet}
        </tr>
      )
    }
  }
}

class Exercise extends Component {
  calcExerciseStats () {
    const e = this.props.exercise
    if (e.type == "BW") {
      return e.sets.reduce((a, s) => a+s.reps, 0)
    }
    else if (e.type == "W" || e.type == 'T') {
      return e.sets.reduce((a, s) => a+s.reps*s.weight, 0)
    }
    return null
  }

  render () {
    const { type, sets, name } = this.props.exercise
    const total = this.calcExerciseStats()
    const unitsByType = { 'BW': '', 'W': 'kg', 'T': 'seconds' }
    const setElems = sets.map(function (s) {
      return (
        <Set
          key={s.id}
          type={type}
          readonly={this.props.readonly}
          set={s}
          deleteSet={this.props.deleteSet} />
    )}, this)

    return (
      <div>
        <h4>{name}</h4>
        <table className={s.sets}>
          <tbody>
            {setElems}
          </tbody>
        </table>
        <p>Total: {total} {unitsByType[type]}</p>
      </div>
    )
  }
}

class WorkoutExercises extends Component {
  render () {
    var wid = this.props.workout.id
    var exs = this.props.workout.exercises.map(function (e) {
//      var addSet = <AddSetForm onAddSetSubmit={this.props.onAddSetSubmit}
//                               workoutId={wid} exercise={e} />
      // Generate a dummy id -- exercises inside a workout don't have
      // a db rowid.
      var id = wid + '-' + e.id
      return (
        <div key={id}>
          <Exercise
            key={id}
            id={id}
            exercise={e}
            readonly={this.props.readonly}
            deleteSet={this.props.deleteSet} />
            TODO form
        </div>
      )
//          {this.props.readonly ? null : addSet}
    }, this)
    return <div>{exs}</div>
  }
}

class WorkoutDetails extends Component {

  componentDidMount () {
    if (!this.props.workout) {
      this.props.loadWorkoutById(this.props.match.params.id)
    }
  }

  render () {
    if (!this.props.workout) {
      return <Layout user={this.props.user}>Loading..</Layout>
    }
    const workoutId = this.props.workout.id
    return (
      <Layout user={this.props.user}>
        <div>
          <WorkoutTitle workout={this.props.workout} />
          <WorkoutExercises
            workout={this.props.workout}
            deleteSet={setId => this.props.deleteSet(workoutId, setId)} />
        </div>
      </Layout>
    )
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    loadWorkoutById: (id) => dispatch(actions.fetchWorkoutById(id)),
    deleteSet: (workoutId, id) => dispatch(actions.deleteSet(workoutId, id))
  }
}

function mapStateToProps (state, props) {
  return {
    user: getUser(state),
    workout: getWorkoutFromRoute(state, props)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WorkoutDetails)
