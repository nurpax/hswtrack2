import React, { Component } from 'react'
import { connect } from 'react-redux'
import { getUser } from '../../auth'
import * as actions from '../../actions'
import { getWorkoutHistory } from '../../selectors'
import Layout from '../../components/Layout'
import WorkoutView from '../../components/workout/WorkoutView'

class Stats extends Component {
  componentDidMount () {
    this.props.loadPastWorkouts(14)
  }

  render () {
    if (!this.props.workouts.length) {
      return <Layout user={this.props.user}>Loading..</Layout>
    }
    const workouts = this.props.workouts.map((w) =>
      <WorkoutView
        key={w.id}
        workout={w}
        readonly
        addSet={() => null}
        deleteSet={() => null} />
    )
    return (
      <Layout user={this.props.user}>
        <div>
          {workouts}
        </div>
      </Layout>
    )
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    loadPastWorkouts: (dayLimit) => dispatch(actions.fetchPastWorkouts(dayLimit))
  }
}

function mapStateToProps (state, props) {
  return {
    user: getUser(state),
    workouts: getWorkoutHistory(state, props),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Stats)
