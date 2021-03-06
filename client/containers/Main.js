
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Layout from '../components/Layout'
import Weight from './Weight'

import { getUser } from '../auth'

class Main extends Component {
  static propTypes = {
    user: PropTypes.object
  }

  render () {
    const main = this.props.user ? <Weight /> : "Login required."
    return (
      <Layout user={this.props.user}>
        {main}
      </Layout>
    )
  }
}

function mapStateToProps (state) {
  return {
    user: getUser(state)
  }
}

export default connect(mapStateToProps)(Main)
