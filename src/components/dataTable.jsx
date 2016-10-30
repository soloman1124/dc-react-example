import React, { Component, PropTypes } from 'react'
import dc from 'dc'
import { ChartPropertyHelper } from '../helpers'

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
      .setProperties('columns', 'group')
      .setContextProperty('dimension');
    chart.render();
  };

  render() {
    return (
      <div ref={this.loadChart} />
    );
  }
}
