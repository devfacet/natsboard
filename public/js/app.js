/*
 * NATSboard
 * Copyright (c) 2015 Fatih Cetinkaya (http://github.com/cmfatih/natsboard)
 * For the full copyright and license information, please view the LICENSE.txt file.
 */

/*jslint  browser: true */
/*global document: false, $: false, console: false, c3: false, d3: false */
'use strict';

// Init the module
var app = function app() {

  var serverURL = location.protocol + '//' + location.hostname + ':' + location.port;

  var database = {
    timeseries: {
      connections:    { limit: 5, data: [] },
      mem:            { limit: 5, data: [] },
      cpu:            { limit: 5, data: [] },
      in_msgs:        { limit: 5, data: [] },
      out_msgs:       { limit: 5, data: [] },
      in_bytes:       { limit: 5, data: [] },
      out_bytes:      { limit: 5, data: [] },
      slow_consumers: { limit: 5, data: [] }
    }
  },
  charts = {
    timeseries: {
    }
  };

  // Init websocket connection
  // var wsHostname = location.hostname,
  //     wsPort     = parseInt(location.port) + 1,
  //     wsUrl      = 'ws://' + wsHostname + ':' + wsPort,
  //     wsConn     = new WebSocket(wsUrl);

  // Open event
  // wsConn.onopen = function onopen() {
  //   console.log('connection opened');
  // };

  // Close event
  // wsConn.onclose = function onclose() {
  //   console.log('connection closed');
  // };

  // Error event
  // wsConn.onerror = function onerror() {
  //   console.error('connection error');
  // };

  // Handle messages
  // wsConn.onmessage = function(event) {

  //   // Split data by new line
  //   event.data.split('\n').forEach(function(line) {
  //     // Parse message from line
  //     var message;
  //     try {
  //       message = JSON.parse(line);
  //     }
  //     catch(e) {
  //       console.error('message could not be parsed');
  //     }
  //   });
  // };

  // Gets data
  var getData = function getData(type, cb) {
    $.getJSON(serverURL + '/data/' + type)
    .done(function(data) {
      return cb(null, data);
    })
    .fail(function(jqxhr) {
      return cb(new Error('failed to fetch data: ' + jqxhr.status + ' - ' + jqxhr.statusText));
    });
  };

  // Updates database
  var updateDatabase = function updateDatabase(type, data) {
    if(!data) {
      return;
    }

    // Update time-series database
    if(type === 'ts') {
      var time = new Date(data.now);

      // Iterate data
      $.each(data, function(key, val) {
        // If key is defined in database then
        if(database.timeseries[key]) {
          // Add into database
          database.timeseries[key].data.push({columns: [time, val]});
          // If data length is greater then limit
          if(database.timeseries[key].data.length > database.timeseries[key].limit) {
            // Remove it from database
            database.timeseries[key].data.shift();
          }
        }
      });
    }
  };

  // Updates chart
  var updateChart = function updateChart(type, chartName) {
    if(!chartName) {
      return;
    }

    // Update time-series chart
    if(type === 'ts') {
      if(!charts.timeseries[chartName] || !charts.timeseries[chartName].chart) {
        console.log('updateChart: invalid chart ' + chartName);
      }

      var chartObj = charts.timeseries[chartName];

      // Prepare columns
      var columns = [];

      for(var i = 0, len = chartObj.labels.length; i < len; i++) {
        var label      = chartObj.labels[i],
            columnData = [label];

        // If metrics is defined then
        if(chartObj.metrics) {
          // It's a custom chart
          var metrics    = chartObj.metrics,
              metricData = [label];
          // Iterate metrics
          database.timeseries[metrics[i]].data.forEach(function(data) {
            // 0 for time, 1 for metric value
            var index = (i > 1) ? 1 : i;
            metricData.push(data.columns[index]);
          });
          columns.push(metricData);
        }
        else {
          // It's a standard chart
          if(database.timeseries[chartName]) {
            database.timeseries[chartName].data.forEach(function(data) {
              columnData.push(data.columns[i]);
            });
          }
          columns.push(columnData);
        }
      }
      chartObj.chart.load({columns: columns});

      // Update labels
      var xLabelVals = [];
      for(var k = 1, len = columns.length; k < len; k++) {
        xLabelVals.push(columns[k][columns[k].length-1]);
      }
      chartObj.chart.axis.labels({x: xLabelVals.join('/') + chartObj.axisXLabelSufix});
      chartObj.chart.axis.min({y: 1});
    }
  };

  // Renders table information
  var renderTableInfo = function renderTableInfo(type, data) {
    if(!data) {
      return;
    }

    // Iterate data
    $.each(data, function(key, val) {
      // If element exists then
      var elem = $('#' + type + '-info-row-' + key);

      if(typeof val === 'object' || (val instanceof Array)) {
        val = '...';
      }

      if(elem.length) {
        // Update info
        elem.html('<td>'+key+'</td><td>'+val+'</td>');
      }
      else {
        // Otherwise add info
        $('#' + type + '-info > tbody:last-child').append('<tr id="' + type + '-info-row-'+key+'"><td>'+key+'</td><td>'+val+'</td></tr>');
      }
    });
  };

  // Renders connection chart
  var renderConnChart = function renderConnChart() {
    if(!charts.timeseries.connections) {
      charts.timeseries.connections = {
        labels: ['x', 'Connections'],
        axisXLabelSufix: ' connections',
        chart: c3.generate({
          bindto: '#connections-chart',
          size: {
            height: 200
          },
          data: {
            x : 'x',
            columns: []
          },
          point: {
            show: true
          },
          axis : {
            x : {
              type : 'timeseries',
              tick : {
                //format : '%H:%M:%S'
                format : ' ',
                outer: false,
                centered: true
              },
              label: {
                position: 'inner-center'
              }
            },
            y: {
              tick: {
                format: d3.format('d'),
                outer: false
              }
            }
          }
        })
      };
    }
    updateChart('ts', 'connections');
  };

  // Renders memory chart
  var renderMemChart = function renderMemChart() {
    if(!charts.timeseries.mem) {
      charts.timeseries.mem = {
        labels: ['x', 'Memory'],
        axisXLabelSufix: ' bytes',
        chart: c3.generate({
          bindto: '#memory-chart',
          size: {
            height: 200
          },
          data: {
            x : 'x',
            columns: []
          },
          point: {
            show: false
          },
          axis : {
            x : {
              type : 'timeseries',
              tick : {
                //format : '%H:%M:%S'
                format : ' ',
                outer: false
              },
              label: {
                position: 'inner-center'
              }
            },
            y: {
              tick: {
                format: d3.format('s'),
                outer: false
              }
            }
          }
        })
      };
    }
    updateChart('ts', 'mem');
  };

  // Renders CPU chart
  var renderCPUChart = function renderCPUChart() {
    if(!charts.timeseries.cpu) {
      charts.timeseries.cpu = {
        labels: ['x', 'CPU'],
        axisXLabelSufix: '% CPU',
        chart: c3.generate({
          bindto: '#cpu-chart',
          size: {
            height: 200
          },
          data: {
            x : 'x',
            columns: []
          },
          point: {
            show: false
          },
          axis: {
            x: {
              type : 'timeseries',
              tick : {
                //format : '%H:%M:%S'
                format : ' ',
                outer: false
              },
              label: {
                position: 'inner-center'
              }
            },
            y: {
              outer: false
            }
          }
        })
      };
    }
    updateChart('ts', 'cpu');
  };

  // Renders message chart
  var renderMsgChart = function renderMsgChart() {
    if(!charts.timeseries.messages) {
      charts.timeseries.messages = {
        labels: ['x', 'In', 'Out'],
        metrics: ['in_msgs', 'in_msgs', 'out_msgs'],
        axisXLabelSufix: ' messages',
        chart: c3.generate({
          bindto: '#messages-chart',
          size: {
            height: 200
          },
          data: {
            x : 'x',
            columns: [['x', 0]]
          },
          point: {
            show: false
          },
          axis : {
            x : {
              type : 'timeseries',
              tick : {
                //format : '%H:%M:%S'
                format : ' ',
                outer: false
              },
              label: {
                position: 'inner-center'
              }
            },
            y: {
              tick: {
                format: d3.format('s'),
                outer: false
              }
            }
          }
        })
      };
    }
    updateChart('ts', 'messages');
  };

  // Renders bytes chart
  var renderBytesChart = function renderBytesChart() {
    if(!charts.timeseries.bytes) {
      charts.timeseries.bytes = {
        labels: ['x', 'In', 'Out'],
        metrics: ['in_bytes', 'in_bytes', 'out_bytes'],
        axisXLabelSufix: ' bytes',
        chart: c3.generate({
          bindto: '#bytes-chart',
          size: {
            height: 200
          },
          data: {
            x : 'x',
            columns: []
          },
          point: {
            show: false
          },
          axis : {
            x : {
              type : 'timeseries',
              tick : {
                //format : '%H:%M:%S'
                format : ' ',
                outer: false
              },
              label: {
                position: 'inner-center'
              }
            },
            y: {
              tick: {
                format: d3.format('s'),
                outer: false
              }
            }
          }
        })
      };
    }
    updateChart('ts', 'bytes');
  };

  // Renders slow consumer chart
  var renderConsumersChart = function renderConsumersChart() {
    if(!charts.timeseries.slow_consumers) {
      charts.timeseries.slow_consumers = {
        labels: ['x', 'Slow Consumers'],
        axisXLabelSufix: ' consumers',
        chart: c3.generate({
          bindto: '#slow-consumers-chart',
          size: {
            height: 200
          },
          data: {
            x : 'x',
            columns: []
          },
          point: {
            show: true
          },
          axis : {
            x : {
              type : 'timeseries',
              tick : {
                //format : '%H:%M:%S'
                format : ' ',
                outer: false,
                centered: true
              },
              label: {
                position: 'inner-center'
              }
            },
            y: {
              tick: {
                format: d3.format('d'),
                outer: false
              }
            }
          }
        })
      };
    }
    updateChart('ts', 'slow_consumers');
  };

  return {
    getData:              getData,
    updateDatabase:       updateDatabase,
    renderTableInfo:      renderTableInfo,
    renderConnChart:      renderConnChart,
    renderMemChart:       renderMemChart,
    renderCPUChart:       renderCPUChart,
    renderMsgChart:       renderMsgChart,
    renderBytesChart:     renderBytesChart,
    renderConsumersChart: renderConsumersChart
  };
};

// Run app
$(document).ready(function() {
  var myApp = app();

  // Index page
  if(location.pathname === '/') {

    // Render server information
    myApp.getData('varz', function(err, data) {
      myApp.renderTableInfo('server', data);
    });

    // Render connection information
    myApp.getData('connz', function(err, data) {
      myApp.renderTableInfo('conn', data);
    });

    // Render subscriptions information
    myApp.getData('subscriptionsz', function(err, data) {
      myApp.renderTableInfo('sub', data);
    });

    // Render route information
    myApp.getData('routez', function(err, data) {
      myApp.renderTableInfo('route', data);
    });

  }

  // Analytics page
  if(location.pathname === '/analytics.html') {

    // Update time-series database
    var running = false;
    setInterval(function() {
      // If it is not running then
      if(!running) {
        running = true;
        myApp.getData('varz', function(err, data) {
          myApp.updateDatabase('ts', data);
          myApp.renderConnChart();
          myApp.renderMemChart();
          myApp.renderCPUChart();
          myApp.renderMsgChart();
          myApp.renderBytesChart();
          myApp.renderConsumersChart();
          running = false;
        });
      }
    }, 1000);
  }
});