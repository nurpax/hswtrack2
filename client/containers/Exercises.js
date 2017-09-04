import React, { Component } from 'react'
import { connect } from 'react-redux'
import { getUser } from '../auth'
import * as actions from '../actions'
import { getExerciseTypes } from '../selectors'
import Layout from '../components/Layout'
import { Well } from '../components/helpers'

import s from './Exercises.scss'

const ExerciseList = (props) => {
  const es = props.exercises.map(function (e) {
    return <li key={e.id}>{e.name}</li>
  })
  return <ul className={s.unstyled}>{es}</ul>
}

class NewExerciseComponent extends Component {
  static mapDispatchToProps = (dispatch) => {
    return {
      addExercise: (e) => dispatch(actions.addExercise(e))
    }
  }

  static mapStateToProps = null

  constructor (props) {
    super(props)
    this.state = { exerciseType: 'W' }
  }

  typeChanged (e) {
    this.setState({ exerciseType: e.target.value })
  }

  handleSubmit (e) {
    e.preventDefault()

    var exerciseName = this.refs.name.value.trim()
    if (exerciseName) {
      this.props.addExercise({ name: exerciseName, type: this.state.exerciseType })
      this.refs.name.value = ''
    }
  }

  render () {
    const Radio = ({type, text, checked}) => {
      return (
        <label className={s.radio}>
          <input
            defaultChecked={this.state.exerciseType==type}
            onClick={e => this.typeChanged(e)}
            value={type}
            type='radio'
            name='ex-type' />
          <span className='label-body'>{text}</span>
        </label>
      )
    }

    return (
      <Well>
        <form onSubmit={e => this.handleSubmit(e)} className={s.exerciseForm}>
          <div>
            <label>Add a new exercise:&nbsp;
              <input type='text' ref='name' placeholder='Exercise name..' />
            </label>
          </div>
          <div>
            <Radio
              type='W'
              text='Weighted exercises like barbell bench.  Weight input always required.' />
            <Radio
              type='BW'
              text='Bodyweight exercises like push-ups or pull-ups.  Extra weight can be input but is not required.' />
            <Radio
              type='T'
              text='Duration based exercises like planking (measured in seconds).' />
          </div>
          <button className='button-primary' type='submit'>Add</button>
        </form>
      </Well>
    )
  }
}

const NewExercise = connect(
  NewExerciseComponent.mapStateToProps,
  NewExerciseComponent.mapDispatchToProps)(NewExerciseComponent)

class Exercises extends Component {
  componentDidMount () {
    this.props.loadExercises()
  }

  render () {
    return (
      <Layout user={this.props.user}>
        <h4>Existing exercises:</h4>
        <ExerciseList exercises={this.props.exercises} />
        <NewExercise />
        <a href='#' onClick={this.props.history.goBack}>Back to workout..</a>
      </Layout>
    )
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    loadExercises: () => dispatch(actions.fetchExercises())
  }
}

function mapStateToProps (state) {
  return {
    user: getUser(state),
    exercises: getExerciseTypes(state)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Exercises)
