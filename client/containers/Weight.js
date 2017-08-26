
import ReactDOM from 'react-dom';
import React, { Component } from 'react'
import * as d3 from "d3"
import * as $ from "jquery-ajax"
import { connect } from 'react-redux'
import { fetchWeights } from '../actions'
import * as sel from '../selectors'

const DEFAULT_DAYS = 90

////////////////// model cruft ////////////////////////
function loadWeights(ndays) {
  return $.ajax({
    type: "GET",
    url: "/rest/weight",
    data: { days: ndays }
  });
}

function loadNotes() {
  return $.ajax({
    type: "GET",
    url: "/rest/note",
    data: []
  });
}

class ModelWeights {
  constructor (weights) {
    this.weights = weights
    this.setStateCB = null
  }

  addWeight (r) {
    this.weights.push(r)
  }

  deleteWeight (r) {
    this.weights = this.this.weights.filter(function (w) { return w.id != r.id })
  }

  load (days) {
    $.when(loadWeights(days)).done(function (w) {
      this.weights = w.payload
      this.setStateCB(this)
    }.bind(this))
  }
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

class ModelWeightTop {
  constructor (owner) {
    this.component = owner
  }

  load (selectedGraphDays) {
    $.when(loadWeights(selectedGraphDays), loadNotes()).done(function (w, n) {
      this.app = { context: { weight: 100 } } // FIXME
      this.weights = new ModelWeights(w[0])
      this.notes   = new ModelNotes(n[0])
      this.selectedRange = selectedGraphDays
      this.owner.setState(this)
    }.bind(this))
  }

  setWeight (newWeight) {
    $.ajax({
      type: "POST",
      url: "/rest/weight",
      data: { weight: newWeight },
      success: function (r) {
        var weight = r.payload
        this.app.context.weight = weight
        this.weights.addWeight(weight)
        this.owner.setState(this)
      }.bind(this)
    })
  }

  clearWeight () {
    if (this.app.context.weight) {
      $.ajax({
        type: "DELETE",
        url: "/rest/weight",
        data: { id: this.app.context.weight.id },
        success: function () {
          this.weights.deleteWeight(this.app.context.weight)
          this.app.context.weight = null
          this.owner.setState(this)
        }.bind(this)
      })
    }
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

  var xAxis = d3.axisBottom(x)

  var yAxis = d3.axisLeft(y)

  var line = d3.line()
               .x(function(d) { return x(d.date) })
               .y(function(d) { return y(d.weight) })

  // TODO enter() etc?? The below code just force-renders the whole plot
  // by deleting all the SVG elems.
  svg.selectAll("g").remove()

  var svgg =
    svg.attr("width", width + margin.left + margin.right)
       .attr("height", height + margin.top + margin.bottom)
       .append("g")
       .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

  var pd = data.map(function (d) { return { date: parseDate(d.date), weight: d.weight } })
  x.domain(d3.extent(pd, function(d) { return d.date }))

  if (props.options.minGraphWeight)
    y.domain([props.options.minGraphWeight, d3.max(pd, function(d) { return d.weight })])
  else
    y.domain(d3.extent(pd, function(d) { return d.weight }))

  svgg.append("g")
     .attr("class", "x axis")
     .attr("transform", "translate(0," + height + ")")
     .call(xAxis)

  svgg.append("g")
     .attr("class", "y axis")
     .call(yAxis)
     .append("text")
     .attr("transform", "rotate(-90)")
     .attr("y", 6)
     .attr("dy", ".71em")
     .style("text-anchor", "end")
     .text("Weight (kg)")

  svgg.append("path")
     .datum(pd)
     .attr("class", "line")
     .attr("d", line)
}

function renderPlot(elt, props) {
  return function(me) {
    var width  = 320
    var height = width / 2
    renderPlotPriv(props, me, width, height)
  }
}

class WeightPlot extends Component {
  componentDidMount () {
    var elt = ReactDOM.findDOMNode(this)
    d3.select(elt).call(renderPlot(elt, this.props.weight))
  }

  shouldComponentUpdate () {
    var elt = ReactDOM.findDOMNode(this)
    d3.select(elt).call(renderPlot(elt, this.props.weight))
    // always skip React's render step
    return false
  }

  render () {
    return <svg width='100%' height='100%' className='col-md-12 weight-plot' />
  }
}

class WeightsTop extends Component {
  state = { selectedRange: 30 }

  constructor (props) {
    super(props)
  }

  componentDidMount () {
    const NDAYS = 30
    this.props.loadWeights(NDAYS)
  }

  clearWeight () {
    //this.props.model.clearWeight()
  }

  setWeight (newWeight) {
    //this.props.model.setWeight(newWeight)
  }

  selectRange (e) {
    this.props.loadWeights(e.target.value)
  }

  render () {
    var choices = [{t:"3 months",  n:90},
                   {t:"12 months", n:365},
                   {t:"24 months", n:365*2},
                   {t:"Lifetime",  n:0}]
    var radios = choices.map(function (c, ndx) {
      var cl = "btn btn-default btn-sm"
      var classes = c.n == this.state.selectedRange ? cl+" active" : cl
      return (
        <label key={c.n} className={classes}>
          <input onClick={this.selectRange} value={c.n} type='radio' name='graph-range' /><small>{c.t}</small>
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
        <div>
          <div className='row'>
            <WeightPlot weight={this.props.weight} />
          </div>
          <div className='btn-group' data-toggle='buttons'>
            {radios}
          </div>
        </div>
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
    }
  }
}

function mapStateToProps (state) {
  return {
    weight: state.weight
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WeightsTop)
