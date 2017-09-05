import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { getUser } from '../../auth'
import * as actions from '../../actions'
import { getWorkoutFromRoute, getExerciseTypes } from '../../selectors'
import Layout from '../../components/Layout'
import { Row, Columns, Well } from '../../components/helpers'
import WorkoutView from '../../components/workout/WorkoutView'
import AddSetForm from '../../components/workout/AddSetForm'
import s from './WorkoutDetails.scss'

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
          <Columns n={12}><b>Add a New Exercise</b></Columns>
        </Row>
        <Row>
          <Columns n={12}>
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
          <WorkoutView
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
