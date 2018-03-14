import './node_modules/dc/dc.css'
import './node_modules/bootstrap/scss/bootstrap.scss';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { ChartContainer, PieChart, RowChart, BubbleChart,
         DataTable, DataCount, BarChart, LineChart } from 'dc-react';
import crossfilter from 'crossfilter';
import * as d3 from "d3"
import dc from 'dc';

const dateFormat = d3.timeFormat('%m/%d/%Y');
const numberFormat = d3.format('.2f');
const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

class CrossfilterContext {
  constructor(data) {
    this.data = data;
    this.crossfilter = crossfilter(data);
    this.groupAll = this.crossfilter.groupAll();
    this.dateDimension = this.crossfilter.dimension(d => d.dd);
    this.yearlyDimension = this.crossfilter.dimension(d => d3.timeYear(d.dd).getFullYear());
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

    this.fluctuationDimension = this.crossfilter.dimension(d => Math.round((d.close - d.open) / d.open * 100));
    this.fluctuationGroup = this.fluctuationDimension.group();

    this.moveMonthsDimension = this.crossfilter.dimension(d => d.month);
    this.moveMonthsGroup = this.moveMonthsDimension.group().reduceSum(d => Math.abs(d.close - d.open));
  }

  get indexAvgByMonthGroup() {
    if (this._indexAvgByMonthGroup) {
      return this._indexAvgByMonthGroup;
    }

    this._indexAvgByMonthGroup = this.moveMonthsDimension.group().reduce(
      (p, v) => {
        ++p.days;
        p.total += (v.open + v.close) / 2;
        p.avg = Math.round(p.total / p.days);
        return p;
      },
      (p, v) => {
          --p.days;
          p.total -= (v.open + v.close) / 2;
          p.avg = p.days ? Math.round(p.total / p.days) : 0;
          return p;
      },
      () => {
        return {days: 0, total: 0, avg: 0};
      }
    );

    return this._indexAvgByMonthGroup;
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

    let parseDate = d3.timeParse('%m/%d/%Y');

    if (!callback) {
      return this._crossfilterContext;
    }
    d3.csv('../ndx.csv', (data) => {
      for (let d of data) {
        d.dd = parseDate(d.date);
        d.month = d3.timeMonth(d.dd);
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
        <h1>Nasdaq 100 Index 1985/11/01-2012/06/29</h1>
        <BubbleChart className="row"
          dimension={ctx => ctx.yearlyDimension}
          group={ctx => ctx.yearlyPerformanceGroup}
          width={990} height={250}
          colorAccessor={d => d.value.absGain}
          keyAccessor={p => p.value.absGain}
          valueAccessor={p => p.value.percentageGain}
          radiusValueAccessor={p => p.value.fluctuationPercentage}
          x={d3.scaleLinear().domain([-2500, 2500])}
          y={d3.scaleLinear().domain([-100, 100])}
          r={d3.scaleLinear().domain([0, 4000])}
          colorDomain={[-500, 500]}
        />
        <div className="row">
          <PieChart
            dimension={ctx => ctx.gainOrLossDimension}
            group={ctx => ctx.gainOrLossGroup}
            width={180} height={180}
            radius={80}
            label={(d) => {
              let percent = numberFormat(d.value / this.crossfilterContext().groupAll.value() * 100);
              return `${d.key} (${percent}%)`;
            }}
          />
          <PieChart
            dimension={ctx => ctx.quarterDimension}
            group={ctx => ctx.quarterGroup}
            width={180} height={180}
            radius={80} innerRadius={30}
          />
          <RowChart
            dimension={ctx => ctx.dayOfWeekDimension}
            group={ctx => ctx.dayOfWeekGroup}
            width={180} height={180}
            elasticX={true}
            margins={{top: 20, left: 10, right: 10, bottom: 20}}
            label={d => d.key.split('.')[1]}
            title={d => d.value}
            xAxis={axis => axis.ticks(4)}
          />
          <BarChart
            dimension={ctx => ctx.fluctuationDimension}
            group={ctx => ctx.fluctuationGroup}
            width={420}
            height={180}
            elasticY={true}
            centerBar={true}
            gap={1}
            round={dc.round.floor}
            alwaysUseRounding={true}
            x={d3.scaleLinear().domain([-25, 25])}
            renderHorizontalGridLines={true}
          />
        </div>
        <DataCount
          dimension={ctx => ctx.crossfilter}
          group={ctx => ctx.groupAll}
        />
        <LineChart
          dimension={ctx => ctx.moveMonthsDimension}
          group={ctx => [ctx.indexAvgByMonthGroup, 'Monthly Index Average']}
          renderArea={true}
          width={990}
          height={200}
          transitionDuration={1000}
          margins={{top: 30, right: 50, bottom: 25, left: 40}}
          mouseZoomable={true}
          x={d3.scaleTime().domain([new Date(1985, 0, 1), new Date(2012, 11, 31)])}
          round={d3.timeMonth.round}
          xUnits={d3.timeMonths}
          elasticY={true}
          renderHorizontalGridLines={true}
          legend={dc.legend().x(800).y(10).itemHeight(13).gap(5)}
          brushOn={false}
          valueAccessor={d => d.value.avg}
          title={(d) => {
            let value = d.value.avg ? d.value.avg : d.value;
            if (isNaN(value)) {
              value = 0;
            }
            return `${dateFormat(d.key)}\n${numberFormat(value)}`;
          }}
          stack={ctx => [ctx.moveMonthsGroup, 'Monthly Index Move', (d) => { return d.value; }]}
        />
        <DataTable
          className="table table-hover"
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
