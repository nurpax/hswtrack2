import React, { Component } from 'react'
import s from './Exercise.scss'

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

export default class Exercise extends Component {
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
