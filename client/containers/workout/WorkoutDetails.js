import React, { Component } from 'react'
import { connect } from 'react-redux'
import { getUser } from '../../auth'
import * as actions from '../../actions'
import { getWorkoutFromRoute } from '../../selectors'
import Layout from '../../components/Layout'
import WorkoutTitle from '../../components/workout/WorkoutTitle'

class WorkoutDetails extends Component {

  componentDidMount () {
    if (!this.props.workout) {
      this.props.loadWorkoutById(this.props.match.params.id)
    }
  }

  render () {
    if (!this.props.workout) {
      return <Layout user={this.props.user}>Loading..</Layout>
    }
    return (
      <Layout user={this.props.user}>
        <div>
          <WorkoutTitle workout={this.props.workout} />
        </div>
      </Layout>
    )
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    loadWorkoutById: (id) => dispatch(actions.fetchWorkoutById(id))
  }
}

function mapStateToProps (state, props) {
  return {
    user: getUser(state),
    workout: getWorkoutFromRoute(state, props)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WorkoutDetails)
