import 'dc/dc.css!';
import 'bootstrap/css/bootstrap.css!';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import ChartContainer from './chartContainer.jsx!';
import DataCount from './components/DataCount.jsx!';
import DataTable from './components/DataTable.jsx!';
import BubbleChart from './components/BubbleChart.jsx!';
import RowChart from './components/RowChart.jsx!';
import PieChart from './components/PieChart.jsx!';
import crossfilter from 'crossfilter';
import d3 from 'd3';

const dateFormat = d3.time.format('%m/%d/%Y');
const numberFormat = d3.format('.2f');
const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

class CrossfilterContext {
  constructor(data) {
    this.data = data;
    this.crossfilter = crossfilter(data);
    this.groupAll = this.crossfilter.groupAll();
    this.dateDimension = this.crossfilter.dimension(d => d.dd);
    this.yearlyDimension = this.crossfilter.dimension(d => d3.time.year(d.dd).getFullYear());
    this.dayOfWeekDimension = this.crossfilter.dimension((d) => {
      var day = d.dd.getDay();
      return `${day}.${weekdayLabels[day]}`;
    });
    this.dayOfWeekGroup = this.dayOfWeekDimension.group();
    this.gainOrLossDimension = this.crossfilter.dimension(d => d.open > d.close ? 'Loss' : 'Gain' );
    this.gainOrLossGroup = this.gainOrLossDimension.group();

    this.quarterDimension = this.crossfilter.dimension((d) => {
      let quarter = Math.floor(d.dd.getMonth() / 3) + 1;
      return `Q${quarter}`;
    });
    this.quarterGroup = this.quarterDimension.group().reduceSum(d => d.volume);
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
  constructor(props) {
    super(props);
    this._crossfilterContext = null;
  }

  crossfilterContext = (callback) => {
    if (!callback) {
      return this._crossfilterContext;
    }
    d3.csv('../ndx.csv', (data) => {
      for (let d of data) {
        d.dd = dateFormat.parse(d.date);
        d.month = d3.time.month(d.dd);
        d.close = +d.close;
        d.open = +d.open;
      }
      this._crossfilterContext = new CrossfilterContext(data);
      callback(this._crossfilterContext);
    });
  };

  render() {
    return (
      <ChartContainer className="container" crossfilterContext={this.crossfilterContext}>
        <BubbleChart className="row"
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
        <div className="row">
          <PieChart
            dimension={ctx => ctx.gainOrLossDimension}
            group={ctx => ctx.gainOrLossGroup}
            width={280} height={180}
            radius={80}
            label={(d) => {
              let percent = numberFormat(d.value / this.crossfilterContext().groupAll.value() * 100);

              return `${d.key} (${percent}%)`;
            }}
          />
          <PieChart
            dimension={ctx => ctx.quarterDimension}
            group={ctx => ctx.quarterGroup}
            width={280} height={180}
            radius={80} innerRadius={30}
          />
          <RowChart
            dimension={ctx => ctx.dayOfWeekDimension}
            group={ctx => ctx.dayOfWeekGroup}
            width={280} height={180}
            elasticX={true}
            label={d => d.key.split('.')[1]}
          />
        </div>
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
        <div className="clearfix" />
      </ChartContainer>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("app"));
