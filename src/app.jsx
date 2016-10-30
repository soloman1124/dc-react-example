import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import ChartContainer from './chartContainer.jsx!'
import DataCount from './components/dataCount.jsx!'
import DataTable from './components/dataTable.jsx!'
import crossfilter from 'crossfilter'
import d3 from 'd3';


const dateFormat = d3.time.format('%m/%d/%Y');
const numberFormat = d3.format('.2f');


class CrossfilterContext {
  constructor(data) {
    this.data = data;
    this.crossfilter = crossfilter(data);
    this.groupAll = this.crossfilter.groupAll();
    this.dateDimension = this.crossfilter.dimension(d => d.dd);
  }
}

class App extends Component {
  crossfilterContext(callback) {
    d3.csv('../ndx.csv', (data) => {
      for (let d of data) {
        d.dd = dateFormat.parse(d.date);
        d.month = d3.time.month(d.dd);
        d.close = +d.close;
        d.open = +d.open;
      }
      callback(new CrossfilterContext(data));
    });
  }

  render() {
    return (
      <ChartContainer crossfilterContext={this.crossfilterContext}>
        <DataCount
          dimension={ctx => ctx.crossfilter}
          group={ctx => ctx.groupAll}
        />
        <DataTable
          dimension={ctx => ctx.dateDimension}
          group={d => `${d.dd.getFullYear()}/${d.dd.getMonth()+1}`}
          columns={[
            'date', 'open', 'close', 'volume'
          ]}
        />
      </ChartContainer>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("app"));
