import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import ChartContainer from './chartContainer.jsx!'
import DataCount from './components/dataCount.jsx!'
import DataTable from './components/dataTable.jsx!'
import BubbleChart from './components/BubbleChart.jsx!'
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
    this.yearlyDimension = this.crossfilter.dimension(d => d3.time.year(d.dd).getFullYear());
  }

  get yearlyPerformanceGroup() {
    if (this._yearlyPerformanceGroup) {
      return this._yearlyPerformanceGroup;
    }

    this._yearlyPerformanceGroup = this.yearlyDimension.group().reduce(
      (p, v) => {
        ++p.count;
        p.absGain += v.close - v.open;
        p.fluctuation += Math.abs(v.close - v.open);
        p.sumIndex += (v.open + v.close) / 2;
        p.avgIndex = p.sumIndex / p.count;
        p.percentageGain = p.avgIndex ? (p.absGain / p.avgIndex) * 100 : 0;
        p.fluctuationPercentage = p.avgIndex ? (p.fluctuation / p.avgIndex) * 100 : 0;
        return p;
      },
      (p, v) => {
        --p.count;
        p.absGain -= v.close - v.open;
        p.fluctuation -= Math.abs(v.close - v.open);
        p.sumIndex -= (v.open + v.close) / 2;
        p.avgIndex = p.count ? p.sumIndex / p.count : 0;
        p.percentageGain = p.avgIndex ? (p.absGain / p.avgIndex) * 100 : 0;
        p.fluctuationPercentage = p.avgIndex ? (p.fluctuation / p.avgIndex) * 100 : 0;
        return p;
      },
      () => {
        return {
          count: 0,
          absGain: 0,
          fluctuation: 0,
          fluctuationPercentage: 0,
          sumIndex: 0,
          avgIndex: 0,
          percentageGain: 0
        };
      }
    );

    return this._yearlyPerformanceGroup;
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
        <BubbleChart
          dimension={ctx => ctx.yearlyDimension}
          group={ctx => ctx.yearlyPerformanceGroup}
          width={990} height={250}
          colorAccessor={d => d.value.absGain}
          keyAccessor={p => p.value.absGain}
          valueAccessor={p => p.value.percentageGain}
          radiusValueAccessor={p => p.value.fluctuationPercentage}
          x={d3.scale.linear().domain([-2500, 2500])}
          y={d3.scale.linear().domain([-100, 100])}
          r={d3.scale.linear().domain([0, 4000])}
          colorDomain={[-500, 500]}
        />
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
