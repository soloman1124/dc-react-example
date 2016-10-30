import React, { PropTypes, Component } from 'react'
import dc from 'dc'
import { ChartPropertyHelper } from '../helpers'

export default class DataCount extends Component {
  static propTypes = {
    dimension: PropTypes.func,
    group: PropTypes.func
  };

  static contextTypes = {
    crossfilterContext: PropTypes.object.isRequired
  };

  loadChart = (container) => {
    const chart = dc.dataCount(container);
    const helper = new ChartPropertyHelper(this, chart);
    helper.setContextProperties('dimension', 'group');
    chart.render();
  };

  render() {
    return (
      <div ref={this.loadChart}>
        <span className='filter-count' /> / <span className='total-count' />
      </div>
    );
  }
}
