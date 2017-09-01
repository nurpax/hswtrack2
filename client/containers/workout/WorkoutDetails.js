import React, { Component } from 'react'
import { connect } from 'react-redux'
import { getUser } from '../../auth'
import * as actions from '../../actions'
import Layout from '../../components/Layout'

const WorkoutDetails = function (props) {
  return (
    <Layout user={props.user}>
      <div>
        Hello workout {props.match.params.id}
      </div>
    </Layout>
  )
}

const mapDispatchToProps = (dispatch) => {
  return {
  }
}

function mapStateToProps (state) {
  return {
    user: getUser(state)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WorkoutDetails)
