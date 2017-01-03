const React = require('react');
const $ = require('jquery');

const ToureiroSidebar = React.createClass({

  pollTimer: undefined,

  getInitialState: function() {
    return {
      servers: [],
      db: [],
      queues: [],
      queue: undefined,
      category: undefined
    };
  },

  componentDidMount: function() {
    const _this = this;
    this.listServers();
    this.listQueues();
    this.pollTimer = setInterval(function() {
      _this.listQueues();
      if (_this.state.queue) {
        _this.getQueue(_this.state.queue.name);
      }
    }, 1000);
  },
    
  listServers: function () {
    const _this = this;
    $.get('state/', function(response) {
      if (response && response.status === 'OK') {
        _this.setState({
          servers: response.servers,
          db: response.db
        });
      } else {
        console.log('Get list servers error with response: ' + response ? JSON.stringify(response) : 'null');
      }
    });
  },

  listQueues: function() {
    const _this = this;
    $.get('queue/list/', function(response) {
      if (response && response.status === 'OK') {
        _this.setState({
          queues: response.queues
        });
        if (!_this.state.queue && response.queues.length > 0) {
          _this.getQueue(response.queues[0]);
        }
      } else {
        console.log('Get list queues error with response: ' + response ? JSON.stringify(response) : 'null');
      }
    });
  },

  getQueue: function(queue) {
    const _this = this;
    $.get('queue/?name=' + encodeURIComponent(queue), function(response) {
      if (response && response.status === 'OK') {
        var state = {
          queue: response.queue,
        };
        if (!_this.state.queue) {
          const stats = response.queue.stats;
          var category = 'active';
          if (stats['active'] > 0) {
            category = 'active';
          } else if (stats['wait'] > 0) {
            category = 'wait';
          } else if (stats['delayed'] > 0) {
            category = 'delayed';
          } else if (stats['completed'] > 0) {
            category = 'completed';
          } else if (stats['failed'] > 0) {
            category = 'failed';
          }
          state.category = category;
          if (_this.props.onQueueChange) {
            _this.props.onQueueChange(queue);
            _this.props.onCategoryChange(category);
          }
        }
        _this.setState(state);
      } else {
        console.log('Get queue error with response: ' + response ? JSON.stringify(response) : 'null');
      }
    });
  },

  changeServer: function (event) {
    const _this = this;
    const server = $(event.target).val();
    $.get('db/?server=' + encodeURIComponent(server), function(response) {
      if (response && response.status === 'OK') {
        _this.state.queue = undefined;
        console.log("Response OK");
      } else {
        console.log('change server error with response: ' + response ? JSON.stringify(response) : 'null');
      }
    });
  },

  changeDb: function(event) {
    const _this = this;
    const db = $(event.target).val();
    $.get('db/?db=' + encodeURIComponent(db), function(response) {
      if (response && response.status === 'OK') {
        _this.state.queue = undefined;
        console.log("Response OK");
      } else {
        console.log('change db error with response: ' + response ? JSON.stringify(response) : 'null');
      }
    });
  },

  changeQueue: function(event) {
    console.log("DEBUG: Change queue");
    const _this = this;
    const queue = $(event.target).val();
    this.getQueue(queue);
    if (_this.props.onQueueChange) {
      _this.props.onQueueChange(queue);
    }
  },

  changeCategory: function(key) {
    const _this = this;
    this.setState({
      category: key
    }, function() {
      if (_this.props.onCategoryChange) {
        _this.props.onCategoryChange(key);
      }
    });
  },

  render: function() {
    const _this = this;
    return (
      <div id="toureiro-sidebar">
        <h4 className="header">Toureiro</h4>
          {/* Select Server */}
        <div id="sidebar-servers" name="server" onChange={this.changeServer}>
          <h5>Select server:</h5>
          <select className="form-control">
            {
              this.state.servers.map(function(server) {
                return (
                  <option value={server} key={server}>{server}</option>
                );
              })
            }
          </select>
        </div>
          {/* Select DB */}
        <div id="sidebar-dbs" name="db" onChange={this.changeDb}>
          <h5>Select db:</h5>
          <select className="form-control">
            {
              this.state.db.map(function(dbNumber) {
                return (
                  <option value={dbNumber} key={dbNumber}>db - {dbNumber}</option>
                );
              })
            }
          </select>
        </div>
          {/* Select Queue */}
        <div id="sidebar-queues">
          <h5>Select Queue:</h5>
          <select name="queue" onChange={this.changeQueue} className="form-control">
          {
            this.state.queues.map(function(queue) {
              return (
                <option value={queue} key={queue}>{queue}</option>
              );
            })
          }
          </select>
        </div>
          {/* Select Queue */}
        <div id="sidebar-stats">
          <h5>Job Status</h5>
          {
            (_this.state.queue) ? (
              ['active', 'wait', 'delayed', 'completed', 'failed'].map(function(key) {
                return (
                  <div key={key} className="sidebar-stat">
                    <a href="javascript:" onClick={_this.changeCategory.bind(_this, key)}>
                      {key[0].toUpperCase() + key.slice(1)} : <span className="badge">{_this.state.queue.stats[key]}</span>
                    </a>
                  </div>
                );
              })
            ) : ''
          }
          <div className="sidebar-stat">
            <a href="javascript:" onClick={_this.changeCategory.bind(_this, 'job')}>Job Details</a>
          </div>
        </div>
        <div className="sidebar-controls">
          <div>
            <input id="readonly" type="checkbox" name="readonly" checkedLink={this.props.readonlyLink} />  <label htmlFor="readonly">ReadOnly</label>
          </div>
        </div>
      </div>
    );
  }

});

module.exports = ToureiroSidebar;
