/*
 * NATSboard
 * Copyright (c) 2015 Fatih Cetinkaya (http://github.com/cmfatih/natsboard)
 * For the full copyright and license information, please view the LICENSE.txt file.
 */

/* jslint  browser: true */
/* global document: false, $: false, console: false, SmoothieChart: false, TimeSeries: false */
'use strict';

// Init the module
var app = function app() {

  var PAGE_DASHBOARD = '/dashboard.html';

  // Init server
  var serverURL    = location.protocol + '//' + location.hostname + ':' + location.port,
      serverCharts = {};

  // Init websocket
  var wsHostname = location.hostname,
      wsPort     = parseInt(location.port) + 1,
      wsUrl      = 'ws://' + wsHostname + ':' + wsPort,
      wsConn     = new WebSocket(wsUrl);

  // Handler for open event
  wsConn.onopen = function onopen() {
    console.log('connection opened');
  };

  // Handler for close event
  wsConn.onclose = function onclose() {
    console.log('connection closed');
  };

  // Handler for error event
  wsConn.onerror = function onerror() {
    console.error('connection error');
  };

  // Handler for message event
  wsConn.onmessage = function(event) {

    // Split data by new line
    event.data.split('\n').forEach(function(line) {
      // Parse message from line
      var message;
      try {
        message = JSON.parse(line);
      }
      catch(e) {
        console.error('message could not be parsed');
      }
      processMessage(message);
    });
  };

  // Processes message
  var processMessage = function processMessage(message) {
    if(!message && typeof message !== 'object') {
      return false;
    }

    // If page is dashboard then
    if(location.pathname === PAGE_DASHBOARD) {
      // If message type is rates then
      if(message.type === 'rates') {
        // Iterate metrics
        [
          {type: 'varz', metric: 'connections', data: []},
          {type: 'varz', metric: 'mem', data: []},
          {type: 'varz', metric: 'cpu', data: [], chartOptions: {precision: 1}},
          {type: 'varz', metric: 'slow_consumers', data: []},
          {type: 'varz', metric: 'in_msgs', data: []},
          {type: 'varz', metric: 'out_msgs', data: []},
          {type: 'varz', metric: 'in_bytes', data: []},
          {type: 'varz', metric: 'out_bytes', data: []}
        ].forEach(function(metric) {
          if(message.rates[metric.type][metric.metric]) {
            message.rates[metric.type][metric.metric].forEach(function(rate) {
              metric.data.push({date: new Date(rate.timestamp), value: rate.value});
            });
          }
          renderChart(metric.metric, metric.data, metric.chartOptions);
        });
      }
    }
  };

  // Gets server url
  var getServerUrl = function getServerUrl() {
    return serverURL;
  };

  // Gets data
  var getData = function getData(url, type, cb) {
    $.getJSON(url + '/nats/' + type)
    .done(function(data) {
      return cb(null, data);
    })
    .fail(function(jqxhr) {
      return cb(new Error('failed to fetch data: ' + jqxhr.status + ' - ' + jqxhr.statusText));
    });
  };

  // Gets all data
  var getDataAll = function getDataAll(url, cb) {
    $.getJSON(url + '/nats/_all')
    .done(function(data) {
      return cb(null, data);
    })
    .fail(function(jqxhr) {
      return cb(new Error('failed to fetch data: ' + jqxhr.status + ' - ' + jqxhr.statusText));
    });
  };

  // Renders table information
  var renderTableInfo = function renderTableInfo(type, data) {
    if(!data) {
      return false;
    }

    // Iterate data
    for(var key in data) {
      if(data.hasOwnProperty(key)) {

        var elem    = $('#' + type + '-info-row-' + key),
            val     = data[key],
            display = true;

        // If the key is not a private then
        if(key.indexOf('_') !== 0) {

          // If value it is an object / array then
          if(typeof val === 'object' || (val instanceof Array)) {
            display = false; // do not display
          }

          if(display) {
            // If element exists then
            if(elem.length) {
              // Update info
              elem.html('<td>'+key+'</td><td>'+val+'</td>');
            }
            else {
              // Otherwise add info
              $('#' + type + '-info > tbody:last-child').append('<tr id="' + type + '-info-row-'+key+'"><td>'+key+'</td><td>'+val+'</td></tr>');
            }
          }
        }
      }
    }

    return true;
  };

  // Renders connections table
  var renderTableConns = function renderTableConns(data) {
    if(!data) {
      return false;
    }

    var content;

    // Iterate data
    for(var key in data.connections) {
      if(data.connections.hasOwnProperty(key)) {

        var val = data.connections[key];

        // Row
        content += '<tr id="connz-list-row-' + val.cid + '" class="small">';

        // Columns
        content += '<td>' + val.cid + '</td>';
        content += '<td>' + val.ip + '</td>';
        content += '<td>' + val.port + '</td>';
        content += '<td>' + val.pending_bytes + '</td>';
        content += '<td>' + val.in_msgs + '</td>';
        content += '<td>' + val.out_msgs + '</td>';
        content += '<td>' + val.in_bytes + '</td>';
        content += '<td>' + val.out_bytes + '</td>';
        content += '<td>' + val.subscriptions + '</td>';
        content += '<td>' + val.lang + '/' + val.version + '</td>';

        content += '</tr>';
      }
    }

    // If content exists then
    if(content) {
      // Add into table
      $('#connz-list > tbody:last-child').append(content);

      // Update table value
      var elemVal = $('#connz-list-value');
      if(elemVal.length) {
        elemVal.text((data.num_connections || 0) + ' connections');
      }
    }

    return true;
  };

  // Renders chart
  var renderChart = function renderChart(type, data, chartOptions) {
    if(!data) {
      return false;
    }
    else if(typeof SmoothieChart !== 'function') {
      return false;
    }

    if(!chartOptions || typeof chartOptions !== 'object') {
      chartOptions = {};
    }

    // If the chart is not defined then
    if(!serverCharts[type]) {

      // Create chart
      var lastRate = {};

      // Custom range function
      var myYRangeFunction = function myYRangeFunction(range) {
        var min = !isNaN(range.min) ? range.min : 0,
            max = !isNaN(range.max) ? range.max : 1;

        min = (max > 1000) ? min : 0;
        max = max*1.1;

        return {min: min, max: max};
      };

      // Check chart options
      if(!chartOptions.grid) {
        chartOptions.grid = {};
      }
      if(!chartOptions.labels) {
        chartOptions.labels = {};
      }

      chartOptions.grid.fillStyle        = '#ffffff';
      chartOptions.grid.strokeStyle      = '#f5f5f5';
      chartOptions.grid.borderVisible    = true;
      chartOptions.grid.verticalSections = 5;
      chartOptions.grid.millisPerLine    = 1000;
      chartOptions.labels.fillStyle      = '#515151';
      chartOptions.labels.precision      = chartOptions.precision || 0;
      chartOptions.labels.disabled       = true;
      chartOptions.minValue              = 0;
      chartOptions.yRangeFunction        = myYRangeFunction;

      var chart  = new SmoothieChart(chartOptions),
          series = new TimeSeries();

      chart.addTimeSeries(series, {
        lineWidth:   3,
        strokeStyle: '#00bd9c',
        fillStyle:   'rgba(0,189,156,0.30)'
      });

      // Iterate data
      if(data instanceof Array) {
        for(var i = 0, len = data.length; i < len; i++) {
          if(data[i].date && typeof data[i].value !== 'undefined') {
            series.append(data[i].date, data[i].value); // append into series
            lastRate = data[i];
          }
        }
      }

      // Add it to charts
      serverCharts[type] = {chart: chart, series: [series]};
      // Start stream
      chart.streamTo(document.getElementById(type + '-chart'), 1000);
    }
    else {
      lastRate = data.slice(-1)[0];
      if(lastRate.date && typeof lastRate.value !== 'undefined') {
        serverCharts[type].series[0].append(lastRate.date, lastRate.value); // append into series
      }
    }

    // Update chart value
    var elemVal = $('#' + type + '-chart-value');
    if(elemVal.length) {
      elemVal.text((lastRate && lastRate.value) || 0);
    }

    return serverCharts[type];
  };

  // Handler for index page
  var indexHandler = function indexHandler(url) {
    // Get all data
    getDataAll(url, function(err, data) {
      if(err) {
        console.error(err);
      }
      // Iterate information types
      ['varz', 'connz', 'subscriptionsz', 'routez'].forEach(function(type) {
        renderTableInfo(type, data[type] || null);
      });
    });

    return true;
  };

  // Handler for dashboard page
  var dashboardHandler = function dashboardHandler() {
    return true;
  };

  // Handler for connections page
  var connsHandler = function connsHandler(url) {
    // Get all data
    getData(url, 'connz', function(err, data) {
      if(err) {
        console.error(err);
      }
      renderTableConns(data);
    });

    return true;
  };

  // Handles routes
  var routeHandler = function routeHandler(route) {
    switch(route) {
      case '/':
        // Index page
        indexHandler(getServerUrl());
        break;
      case '/dashboard.html':
        // Dashboard page
        dashboardHandler();
        break;
      case '/connections.html':
        // Dashboard page
        connsHandler(getServerUrl());
        break;
      // Default
      default:
        break;
    }
  };

  // Return
  return {
    routeHandler: routeHandler
  };
};

// Init app
var myApp = app();

// Run app
$(document).ready(function() {
  myApp.routeHandler(location.pathname);
});