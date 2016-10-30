import React, { PropTypes, Component } from 'react'
import dc from 'dc'

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
    for (let [key, value] of Object.entries(this.props)) {
      if (value) {
        chart[key](value(this.context.crossfilterContext));
      }
    }
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
