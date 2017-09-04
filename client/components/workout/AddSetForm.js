import React, { Component } from 'react'
import { Unhide } from './helpers'
import { Row, Columns } from '../helpers'

export default class AddSetForm extends Component {
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

