import React, { Component, PropTypes } from 'react'
import dc from 'dc'
import { Base } from './Base.jsx!'

class DataTable extends Component {
  static propTypes = {
    columns: PropTypes.array.isRequired,
  };

  loadChart = (container) => {
    const chart = dc.dataTable(container);
    const helper = this.props.chartHelper(this, chart, false);
    helper.setContextProperties('dimension')
          .setProperties('columns', 'group');

    chart.render();
  };

  render() {
    return (
      <div ref={this.loadChart} />
    );
  }
}

export default Base(DataTable);
