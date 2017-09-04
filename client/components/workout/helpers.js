
import React, { Component } from 'react'
import s from './helpers.scss'

// Put content hidden behind a clickable link.  Once the link is
// clicked, the hidden child content is displayed.
export class Unhide extends Component {
  constructor (props) {
    super(props)
    this.state = { visible: false }
  }

  toggleVis = (e) => {
    e.preventDefault()
    this.setState({ visible: !this.state.visible })
  }

  render () {
    var vis   = this.state.visible  ? s.show : s.hide
    var invis = !this.state.visible ? s.show : s.hide

    return (
      <div>
        <a onClick={this.toggleVis} className={invis} href='#'>{this.props.title}</a>
        <div className={vis}>
          {this.props.children}
        </div>
      </div>
    )
  }
}
