import React, { Component, PropTypes } from 'react'
import dc from 'dc'
import { ChartPropertyHelper } from '../helpers'

export default class BubbleChart extends Component {
  static propTypes = {
    dimension: PropTypes.func,
    group: PropTypes.func,
    width: PropTypes.number,
    height: PropTypes.number,
    colorAccessor: PropTypes.func,
    keyAccessor: PropTypes.func,
    valueAccessor: PropTypes.func,
    radiusValueAccessor: PropTypes.func,
    x: PropTypes.func,
    y: PropTypes.func,
    r: PropTypes.func,
    colorDomain: PropTypes.array
  };
  static contextTypes = {
    crossfilterContext: PropTypes.object.isRequired
  };

  loadChart = (container) => {
    const chart = dc.bubbleChart(container);
    const helper = new ChartPropertyHelper(this, chart);
    helper
      .setProperties('width', 'height', 'colorAccessor', 'keyAccessor',
                     'valueAccessor', 'radiusValueAccessor', 'x', 'y', 'r',
                     'colorDomain')
      .setContextProperties('dimension', 'group');

    chart.render();
  };

  render() {
    return (
      <div ref={this.loadChart} />
    );
  }
}
