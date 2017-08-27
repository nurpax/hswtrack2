
import ReactDOM from 'react-dom'
import React, { Component } from 'react'
import * as d3 from "d3"
import * as $ from "jquery-ajax"
import { connect } from 'react-redux'
import { fetchWeights, setWeightDayLimit } from '../actions'
import { Row, Columns } from '../components/helpers'
import * as sel from '../selectors'
import s from './Weight.scss'

////////////////// model cruft ////////////////////////
function loadNotes() {
  return $.ajax({
    type: "GET",
    url: "/rest/note",
    data: []
  });
}

class ModelNotes {
  constructor (n) {
    this.notes = n
  }

  deleteById (id_) {
    $.ajax({ url: "/rest/note",
            type: "DELETE",
            data: { id: id_ },
            success: function () {
              this.notes = this.notes.filter(function (n) { return n.id != id_ })
              this.setStateCB(this)
            }.bind(this)
    })
  }

  addNote (text) {
    $.ajax({ url: "/rest/note",
            type: "POST",
            data: { text: text },
            success: function (resp) {
              this.notes.push(resp.payload)
              this.setStateCB(this)
            }.bind(this)
    })
  }
}
////////////////// model cruft ////////////////////////


class Comment extends Component {
  deleteComment () {
    if (!confirm("OK to delete note?"))
      return false
    this.props.onDeleteComment(this.props.id)
    return false
  }

  render () {
    return <li>{this.props.text} <a onClick={this.deleteComment} href='#'>&times;</a></li>
  }
}

class CommentList extends Component {
  constructor (props) {
    super(props)
    this.props.model.setStateCB = function (s) { this.setState(s) }.bind(this)
  }

  handleDeleteComment (id) {
    this.props.model.deleteById(id)
  }

  handleAddComment () {
    var text = this.refs.comment.getDOMNode().value.trim()
    if (!text) {
      return false
    }
    this.props.model.addNote(text)
    this.refs.comment.getDOMNode().value = ''
    return false
  }

  render () {
    var comments = this.state.notes.map(function (c) {
      return <Comment onDeleteComment={this.handleDeleteComment} key={c.id} id={c.id} text={c.text} />
    }.bind(this))

    return (
      <div>
        <h4>Comments</h4>
        <div className='col-md-6'>
          <ul className='list-unstyled'>
            {comments}
            <li>
              <form onSubmit={this.handleAddComment}>
                <input ref='comment' size='24' type='text' placeholder='Add comment..' />
                <button className='btn btn-default btn-xs'>Save</button>
              </form>
            </li>
          </ul>
        </div>
      </div>
    )
  }
}

class TodayWeight extends Component {
  handleClearWeight () {
    this.props.onClearWeight()
  }

  handleWeightSubmit () {
    var w = this.refs.weight.getDOMNode().value.trim()
    if (!w) {
      return false
    }
    this.props.onWeightSubmit(w)
    this.refs.weight.getDOMNode().value = ''
    return false
  }

  render () {
    if (this.props.weight) {
      return (
        <div>
          <p>Your weight today is: {this.props.weight.weight} kg &nbsp;
          <button onClick={this.handleClearWeight} className='btn btn-default btn-xs'>Clear</button>
          </p>
        </div>
      )
    } else {
      return (
        <div className='well'>
          <p>Please enter your weight (kg):</p>
          <form onSubmit={this.handleWeightSubmit}>
            <input ref='weight' type='number' step='any' min='0' placeholder='Enter weight..' />
            <button className='btn btn-primary'>Save</button>
          </form>
        </div>
      )
    }
  }
}

function renderPlotPriv(props, svg, origWidth, origHeight) {
  var data    = props.weights

  var margin = { top: 10, right: 25, bottom: 30, left: 25 },
      width  = origWidth - margin.left - margin.right,
      height = origHeight - margin.top - margin.bottom

  var parseDate = d3.timeParse("%Y-%m-%d")

  var x = d3.scaleTime()
                 .range([0, width])

  var y = d3.scaleLinear()
                  .range([height, 0])

  var line = d3.line()
               .x(function(d) { return x(d.date) })
               .y(function(d) { return y(d.weight) })

  var svgg =
    svg.append('svg')
       .attr("width", width + margin.left + margin.right)
       .attr("height", height + margin.top + margin.bottom)
       .append("g")
       .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

  var pd = data.map(function (d) { return { date: parseDate(d.date), weight: d.weight } })
  x.domain(d3.extent(pd, function(d) { return d.date }))

  if (props.options.minGraphWeight)
    y.domain([props.options.minGraphWeight, d3.max(pd, function(d) { return d.weight })])
  else
    y.domain(d3.extent(pd, function(d) { return d.weight }))

  // add the X Axis
  svgg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))

  // add the Y Axis
  svgg.append("g")
      .call(d3.axisLeft(y))

  // add the valueline path.
  svgg.append("path")
      .data([pd])
      .attr("class", s.line)
      .attr("d", line)
}

function renderPlot(elt, props) {
  return function(me) {
    var width  = 640 // 320
    var height = width / 2
    renderPlotPriv(props, me, width, height)
  }
}

class WeightPlot extends Component {
  componentDidMount () {
    this.drawChart(this.props)
  }

  drawChart (nextProps) {
   const chart = ReactDOM.findDOMNode(this)
   if (chart && nextProps.weight) {
     d3.select(chart).call(renderPlot(chart, nextProps.weight))
   }
  }

  componentWillReceiveProps (nextProps) {
    this.removePreviousChart()
    this.drawChart(nextProps)
  }

  removePreviousChart () {
    // TODO see https://github.com/adeveloperdiary/react-d3-charts/blob/gh-pages/01_Visitor_Dashboard/lib/charts/LineChart.jsx
    // or use some react-d3 library instead of this kludge
    const chart = ReactDOM.findDOMNode(this)
    while (chart.hasChildNodes()) {
      chart.removeChild(chart.lastChild)
    }
  }

  render () {
    return <div id='chart' width='600px' height='400px' />
  }
}

class WeightsTop extends Component {
  constructor (props) {
    super(props)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.weightui.dayLimit != nextProps.weightui.dayLimit) {
      this.props.loadWeights(nextProps.weightui.dayLimit)
    }
  }

  componentDidMount () {
    this.props.loadWeights(this.props.weightui.dayLimit)
  }

  clearWeight () {
    //this.props.model.clearWeight()
  }

  setWeight (newWeight) {
    //this.props.model.setWeight(newWeight)
  }

  selectRange (e) {
    let newLimit = +e.target.value
    this.props.setWeightDayLimit(newLimit)
  }

  render () {
    var choices = [{t:"3 months",  n:90},
                   {t:"12 months", n:365},
                   {t:"24 months", n:365*2},
                   {t:"Lifetime",  n:0}]
    var radios = choices.map(function (c, ndx) {
      let checked = c.n == this.props.weightui.dayLimit
      return (
        <label key={c.n}>
          <input
            defaultChecked={checked}
            onClick={e => this.selectRange(e)}
            value={c.n}
            type='radio'
            name='graph-range' />
          <span className='label-body'>{c.t}</span>
        </label>)
    }, this)

    if (!this.props.weight.weights)
      return null
    return (
      <div>
        <TodayWeight
          onWeightSubmit={this.setWeight}
          onClearWeight={this.clearWeight}
          weight={this.props.weight.today} />
        <br />
        <Row>
          <Columns n={12}>
            <WeightPlot weight={this.props.weight} />
          </Columns>
        </Row>
        <Row>
          <Columns n={6}>
            {radios}
          </Columns>
        </Row>
        <br />
      </div>
//        <CommentList model={this.state.notes} />
    )
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    loadWeights: (nDays) => {
      dispatch(fetchWeights(nDays))
    },
    setWeightDayLimit: (nDays) => {
      dispatch(setWeightDayLimit(nDays))
    }
  }
}

function mapStateToProps (state) {
  return {
    weight: state.weight,
    weightui: state.weightui
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WeightsTop)
