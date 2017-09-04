import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { getUser } from '../../auth'
import * as actions from '../../actions'
import { getWorkoutFromRoute, getExerciseTypes } from '../../selectors'
import Layout from '../../components/Layout'
import { Row, Columns, Well } from '../../components/helpers'
import WorkoutTitle from '../../components/workout/WorkoutTitle'
import { Unhide } from '../../components/workout/helpers'

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

    const rmSet = readonly ?
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

class AddSetForm extends Component {
  handleSubmit = (e) => {
    e.preventDefault()
    const reps   = this.refs.reps.value.trim()
    let weight = this.refs.weight.value.trim()
    if (!reps) {
      return
    }
    if (weight == '')
      weight = 0

    this.refs.reps.value = ''
    this.refs.weight.value = ''

    this.props.addSet({
      reps: reps,
      weight: weight,
      exercise: this.props.exercise,
      workoutId: this.props.workoutId
    })
  }

  render () {
    if (!this.props.exercise)
      return null

    let repsinput =
      <Columns n={4}>
        <input className='u-full-width' type='number' ref='reps' placeholder='Reps..' />
      </Columns>
    let inp = null
    if (this.props.exercise.type == 'BW') {
      inp =
        <Unhide title='Advanced &raquo;'>
          <input className='u-full-width' type='number' step='any' min='0' ref='weight' placeholder='Weight..' />
        </Unhide>
    } else if (this.props.exercise.type == 'W') {
      inp = <input className='u-full-width' type='number' step='any' min='0' ref='weight' placeholder='Weight..' />
    } else if (this.props.exercise.type == 'T') {
      inp = <input className='u-full-width' type='number' step='any' min='0' ref='weight' placeholder='Time (s)..' />
      repsinput = <input type='hidden' ref='reps' value='1' />
    }
    return (
      <form onSubmit={this.handleSubmit}>
        <Row>
          {repsinput}
          <Columns n={4}>
            {inp}
          </Columns>
          <Columns n={2}>
            <button className='button-primary' type='submit'>Add Set</button>
          </Columns>
        </Row>
      </form>
    )
  }
}

class AddExerciseForm extends Component {
  constructor (props) {
    super(props)
    this.state = { selectedExercise: null }
  }

  exerciseSelected = (e) => {
    this.setState({ selectedExercise: this.props.exerciseTypes[e.target.value] })
  }

  render () {
    const exs = this.props.exerciseTypes.map(function (et, index) {
      return <option key={et.id} value={index}>{et.name}</option>
    })
    return (
      <Well>
        <Row>
          <Columns n={4}><b>Add a New Exercise</b></Columns>
        </Row>
        <Row>
          <Columns n={6}>
            <select onChange={this.exerciseSelected}>
              <option defaultChecked />
              {exs}
            </select>
          </Columns>
        </Row>
        <AddSetForm
          addSet={this.props.addSet}
          workoutId={this.props.workout.id}
          exercise={this.state.selectedExercise} />
        <Row>
          <Columns n={12}>
            <label className={s.inline}>Favorite exercise missing?</label> <Link to='/exercises'>Add it!</Link>
          </Columns>
        </Row>
      </Well>
    )
  }
}

class WorkoutExercises extends Component {
  render () {
    const wid = this.props.workout.id
    const exs = this.props.workout.exercises.map(function (e) {
      const addSet =
        <AddSetForm
          addSet={this.props.addSet}
          workoutId={wid}
          exercise={e} />
      // Generate a dummy id -- exercises inside a workout don't have
      // a db rowid.
      const id = wid + '-' + e.id
      return (
        <div key={id}>
          <Exercise
            id={id}
            exercise={e}
            readonly={this.props.readonly}
            deleteSet={this.props.deleteSet} />
          {this.props.readonly ? null : addSet}
        </div>
      )
    }, this)
    return <div>{exs}</div>
  }
}

class WorkoutDetails extends Component {
  componentDidMount () {
    if (!this.props.workout) {
      this.props.loadWorkoutById(this.props.match.params.id)
    }
    if (!this.props.exerciseTypes.length) {
      this.props.loadExerciseTypes()
    }
  }

  render () {
    if (!this.props.workout) {
      return <Layout user={this.props.user}>Loading..</Layout>
    }
    const workoutId = this.props.workout.id
    const canEdit = this.props.user.id == this.props.workout.userId
    const addExercise = canEdit ?
      <AddExerciseForm
        workout={this.props.workout}
        addSet={this.props.addSet}
        exerciseTypes={this.props.exerciseTypes} />
      :
      null
    return (
      <Layout user={this.props.user}>
        <div>
          <WorkoutTitle workout={this.props.workout} />
          <WorkoutExercises
            workout={this.props.workout}
            readonly={!canEdit}
            addSet={this.props.addSet}
            deleteSet={setId => this.props.deleteSet(workoutId, setId)} />
          <br />
          {addExercise}
        </div>
      </Layout>
    )
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    loadWorkoutById: (id) => dispatch(actions.fetchWorkoutById(id)),
    loadExerciseTypes: () => dispatch(actions.fetchExercises()),
    addSet: (set) => dispatch(actions.addSet(set)),
    deleteSet: (workoutId, id) => dispatch(actions.deleteSet(workoutId, id))
  }
}

function mapStateToProps (state, props) {
  return {
    user: getUser(state),
    workout: getWorkoutFromRoute(state, props),
    exerciseTypes: getExerciseTypes(state)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WorkoutDetails)
