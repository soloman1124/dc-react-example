import React, { Component, PropTypes } from 'react'
import dc from 'dc'

class ChartPropertyHelper {
  constructor(component, chart) {
    this.component = component;
    this.chart = chart;
  }

  get props() {
    return this.component.props;
  }

  setProperty(key) {
    if (this.props.hasOwnProperty(key)) {
      this.chart[key](this.props[key]);
    }
    return this;
  }

  setContextProperty(key) {
    if (this.props.hasOwnProperty(key)) {
      let func = this.props[key];
      if (func) {
        this.chart[key](func(this.component.context.crossfilterContext));
      }
    }
    return this;
  }
}

export default class DataTable extends Component {
  static propTypes = {
    dimension: PropTypes.func,
    group: PropTypes.func,
    columns: PropTypes.array.isRequired,
  };

  static contextTypes = {
    crossfilterContext: PropTypes.object.isRequired
  };

  loadChart = (container) => {
    const chart = dc.dataTable(container);
    const helper = new ChartPropertyHelper(this, chart);
    helper
      .setProperty('columns')
      .setProperty('group')
      .setContextProperty('dimension');
    chart.render();
  };

  render() {
    return (
      <div ref={this.loadChart} />
    );
  }
}
