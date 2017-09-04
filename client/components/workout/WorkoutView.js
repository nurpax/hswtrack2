import React, { Component } from 'react'
import Exercise from './Exercise'
import AddSetForm from './AddSetForm'
import WorkoutTitle from './WorkoutTitle'

export default class WorkoutView extends Component {
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
    return (
      <div>
        <WorkoutTitle workout={this.props.workout} />
        {exs}
      </div>
    )
  }
}
