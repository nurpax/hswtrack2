
import React, { Component } from 'react'

var Link = require('react-router').Link

export default class Test extends Component {
  render () {
    return (
      <div>
        <h1>Should be logged in here</h1>
        <Link to='/'>Go home</Link>
      </div>
    )
  }
}
