import React from 'react'
import { Provider } from 'react-redux'
import { Route, Switch } from 'react-router-dom'
import { ConnectedRouter } from 'react-router-redux'

import { userIsNotAuthenticatedRedir, userIsAuthenticatedRedir } from '../auth'
import Main from './Main'
import Login from './Login'
import SignUp from './SignUp'
import Profile from './Profile'

import Workout from './workout/Workout'
import WorkoutDetails from './workout/WorkoutDetails'
import Exercises from './Exercises'
import Stats from './stats/Stats'

import configureStore from '../configureStore'

const { store, history } = configureStore()

const AuthLogin = userIsNotAuthenticatedRedir(Login)
const AuthSignUp = userIsNotAuthenticatedRedir(SignUp)
const AuthProfile = userIsAuthenticatedRedir(Profile)

const AuthWorkout = userIsAuthenticatedRedir(Workout)
const AuthWorkoutDetails = userIsAuthenticatedRedir(WorkoutDetails)
const AuthExercises = userIsAuthenticatedRedir(Exercises)
const AuthStats = userIsAuthenticatedRedir(Stats)

const Root = () => (
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Switch>
        <Route exact path='/' component={Main} />
        <Route exact path='/workout/:id' component={AuthWorkoutDetails} />
        <Route exact path='/workout' component={AuthWorkout} />
        <Route exact path='/stats' component={AuthStats} />
        <Route exact path='/exercises' component={AuthExercises} />
        <Route exact path='/login' component={AuthLogin} />
        <Route exact path='/profile' component={AuthProfile} />
        <Route exact path='/signup' component={AuthSignUp} />
      </Switch>
    </ConnectedRouter>
  </Provider>
)

export default Root
