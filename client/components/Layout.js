
import React, { Component, PropTypes } from 'react'

import { Link } from 'react-router'
import LogoutLink from '../containers/LogoutLink'

export default class Layout extends Component {
  static propTypes = {
    children: PropTypes.any,
    user: PropTypes.object,
    isLoginScreen: PropTypes.bool
  }
  render () {
    let signup = <Link to='/signup'>Sign Up</Link>
    let login = this.props.user
      ? null
      : <span><Link to='/login'>Sign In</Link> | {signup}</span>
    let logout = this.props.user
      ? <span><LogoutLink to='/'>Log out</LogoutLink> (logged in as {this.props.user.login})</span>
      : null
    let loginControls =
      this.props.isLoginScreen ? null : <span>{login}{logout}</span>
    return (
      <div className='container'>
        <h1>Todo list app</h1>
        {this.props.children}
        <br />
        <div>
          <Link to='/'>Home</Link>{loginControls ? <span> | {loginControls}</span> : null}
        </div>
      </div>
    )
  }
}
