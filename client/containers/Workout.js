import ReactDOM from 'react-dom'
import React, { Component } from 'react'
import * as d3 from "d3"
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { getUser } from '../auth'
import * as actions from '../actions'
import { Row, Columns } from '../components/helpers'
import Layout from '../components/Layout'
import s from './Weight.scss'

const mapDispatchToProps = (dispatch) => {
  return {
  }
}

function mapStateToProps (state) {
  return {
    user: getUser(state)
  }
}

const Workout = function (props) {
  return (
    <Layout user={props.user}>
      <div><Link to='/exercises'>Edit exercises</Link></div>
    </Layout>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(Workout)
