
import ReactDOM from 'react-dom'
import React, { Component } from 'react'
import * as d3 from "d3"
import { connect } from 'react-redux'
import * as actions from '../actions'
import { Row, Columns, Well } from '../components/helpers'
import s from './Weight.scss'

class Comment extends Component {
  deleteComment = (e) => {
    e.preventDefault()
    if (confirm("OK to delete note?")) {
      this.props.deleteComment(this.props.id)
    }
  }

  render () {
    return <li>{this.props.text} <a onClick={this.deleteComment} href='#'>&times;</a></li>
  }
}

class CommentListComponent extends Component {
  static mapDispatchToProps = (dispatch) => {
    return {
      addNote: (text) => {
        dispatch(actions.addNote(text))
      },
      deleteNote: (id) => {
        dispatch(actions.deleteNote(id))
      }
    }
  }

  static mapStateToProps = (state) => {
    return {
      notes: state.weightNotes
    }
  }


  handleDeleteComment = (id) => {
    this.props.deleteNote(id)
  }

  handleAddComment = (e) => {
    e.preventDefault()
    var text = this.refs.comment.value.trim()
    if (!text)
      return
    this.props.addNote(text)
    this.refs.comment.value = ''
  }

  render () {
    var comments = this.props.notes.map(function (c) {
      return <Comment deleteComment={this.handleDeleteComment} key={c.id} id={c.id} text={c.text} />
    }, this)

    return (
      <div>
        <h4>Comments</h4>
        <Row>
          <Columns n={12}>
            <ul className={s.unstyled}>
              {comments}
              <li>
                <form onSubmit={this.handleAddComment}>
                  <input ref='comment' size='24' type='text' placeholder='Add comment..' />
                  &nbsp;
                  <button className='button-primary'>Save</button>
                </form>
              </li>
            </ul>
          </Columns>
        </Row>
      </div>
    )
  }
}

const CommentList = connect(CommentListComponent.mapStateToProps, CommentListComponent.mapDispatchToProps)(CommentListComponent)

class TodayWeight extends Component {
  handleWeightSubmit = (e) => {
    e.preventDefault()
    var w = this.refs.weight.value.trim()
    if (!w) {
      return
    }
    this.props.saveWeight(w)
    this.refs.weight.value = ''
  }

  render () {
    if (this.props.weight) {
      return (
        <div>
          <p>Your weight today is: {this.props.weight.weight} kg &nbsp;
          <button onClick={this.props.clearWeight}>Clear</button>
          </p>
        </div>
      )
    } else {
      return (
        <Well>
          <p>Please enter your weight (kg):</p>
          <form onSubmit={this.handleWeightSubmit}>
            <input ref='weight' type='number' step='any' min='0' placeholder='Enter weight..' />
            &nbsp;<button className='button-primary'>Save</button>
          </form>
        </Well>
      )
    }
  }
}

function renderPlotPriv(props, svg, origWidth, origHeight) {
  var data    = props.weights

  var margin = { top: 10, right: 0, bottom: 30, left: 25 },
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
    var width  = 340
    var height = 2 * width / 3
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
    // TODO see
    // https://github.com/adeveloperdiary/react-d3-charts/blob/gh-pages/01_Visitor_Dashboard/lib/charts/LineChart.jsx
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

class WeightValues extends Component {
    render () {
        // Take last 10 weights, sort in latest to oldest order
        const weights = this.props.weight.weights.slice(0, 10).sort((a, b) => {
            if (a.date > b.date) {
                return 1;
            }
            if (b.date > a.date) {
                return -1;
            }
            return 0;
        });
        if (weights.length == 0) {
            return null;
        }
        const ws = weights.map(w => {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'row'
                }}>
                    <div style={{ width: '100px' }}>{w.date}:</div>
                    <div><b>{w.weight}</b> kg</div>
                </div>
            );
        });
        return (
            <div style={{marginBottom: '10px', fontSize: '0.9em'}}>
                Last 10 weights<br />
                {ws}
            </div>
        )
    }
}

class WeightsTop extends Component {
  constructor (props) {
    super(props)
  }

  componentWillReceiveProps(nextProps) {
    // TODO would be cleaner to loadWeights() in the reducer that handles
    // changing dayLimit.
    if (this.props.weightui.dayLimit != nextProps.weightui.dayLimit) {
      this.props.loadWeights(nextProps.weightui.dayLimit)
    }
  }

  componentDidMount () {
    this.props.loadWeights(this.props.weightui.dayLimit)
    this.props.loadNotes()
  }

  clearWeight = () => {
    if (this.props.weight.today) {
      this.props.clearWeight(this.props.weight.today.id)
    }
  }

  selectRange (e) {
    const newLimit = +e.target.value
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

    if (!this.props.weight.weights) {
      return null;
    }
    return (
      <div>
        <br />
        <TodayWeight
          clearWeight={this.clearWeight}
          weight={this.props.weight.today}
          saveWeight={this.props.saveWeight} />
        <br />
        <div>
          <WeightPlot weight={this.props.weight} />
        </div>
        <WeightValues weight={this.props.weight} />
        <div>
          {radios}
        </div>
        <br />
        <div>
          <CommentList />
        </div>
      </div>
    )
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    loadWeights: (nDays) => {
      dispatch(actions.fetchWeights(nDays))
    },
    saveWeight: (w) => {
      dispatch(actions.saveWeight(w))
    },
    clearWeight: (id) => {
      dispatch(actions.clearWeight(id))
    },
    setWeightDayLimit: (nDays) => {
      dispatch(actions.setWeightDayLimit(nDays))
    },
    loadNotes: () => {
      dispatch(actions.fetchNotes())
    }
  }
}

function mapStateToProps (state) {
  return {
    weight: state.weight,
    weightui: state.weightui,
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WeightsTop)
