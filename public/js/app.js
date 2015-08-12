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

  var database = {
        timeseries: {
          mem: {
            limit: 20,
            data:  []
          },
          connections: {
            limit: 20,
            data:  []
          },
          in_msgs: {
            limit: 5,
            data:  []
          },
          out_msgs: {
            limit: 5,
            data:  []
          },
        }
      },
      charts = {
        timeseries: {
          mem: {
            label: 'Memory',
            chart: c3.generate({
              bindto: '#memory-chart',
              size: {
                height: 200
              },
              data: {
                x : 'x',
                columns: [['x', 0], ['Memory', 0]]
              },
              point: {
                show: false
              },
              axis : {
                x : {
                  type : 'timeseries',
                  tick : {
                    format : '%H:%M:%S'
                  }
                },
                y: {
                  tick: {
                    format: d3.format('s')
                  }
                }
              }
            })
          },
          connections: {
            label: 'Connections',
            chart: c3.generate({
              bindto: '#connections-chart',
              size: {
                height: 200
              },
              data: {
                x : 'x',
                columns: [['x', 0], ['Connections', 0]]
              },
              point: {
                show: true
              },
              axis : {
                x : {
                  type : 'timeseries',
                  tick : {
                    format : '%H:%M:%S'
                  }
                },
                y: {
                  tick: {
                    format: d3.format('d')
                  }
                }
              }
            })
          },
          in_msgs: {
            label: 'Incoming Messages',
            chart: c3.generate({
              bindto: '#messages-in-chart',
              size: {
                height: 200,
                width: 300
              },
              data: {
                x : 'x',
                columns: [['x', 0], ['Incoming Messages', 0]]
              },
              point: {
                show: true
              },
              axis : {
                x : {
                  type : 'timeseries',
                  tick : {
                    format : '%H:%M:%S'
                  }
                },
                y: {
                  tick: {
                    format: d3.format('d')
                  }
                }
              }
            })
          },
          out_msgs: {
            label: 'Outgoing Messages',
            chart: c3.generate({
              bindto: '#messages-out-chart',
              size: {
                height: 200,
                width: 300
              },
              data: {
                x : 'x',
                columns: [['x', 0], ['Outgoing Messages', 0]]
              },
              point: {
                show: true
              },
              axis : {
                x : {
                  type : 'timeseries',
                  tick : {
                    format : '%H:%M:%S'
                  }
                },
                y: {
                  tick: {
                    format: d3.format('d')
                  }
                }
              }
            })
          }
        }
      };


  // Init websocket connection
  var wsHostname = location.hostname,
      wsPort     = parseInt(location.port) + 1,
      wsUrl      = 'ws://' + wsHostname + ':' + wsPort,
      wsConn     = new WebSocket(wsUrl);

  // Open event
  wsConn.onopen = function onopen() {
    console.log('connection opened');
  };

  // Close event
  wsConn.onclose = function onclose() {
    console.log('connection closed');
  };

  // Error event
  wsConn.onerror = function onerror() {
    console.error('connection error');
  };

  // Handle messages
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

      // If type varz then
      if(message.type === 'varz') {
        // Update server information
        $.each(message.data, function(key, val) {
          // If element exists then
          var elem = $('#server-info-row-' + key);
          if(elem.length) {
            // Update info
            elem.html('<td>'+key+'</td><td>'+val+'</td>');
          }
          else {
            // Otheriwse add info
            $('#server-info > tbody:last-child').append('<tr id="server-info-row-'+key+'"><td>'+key+'</td><td>'+val+'</td></tr>');
          }

          // Update time-series database
          if(database.timeseries[key]) {
            database.timeseries[key].data.push({date: message.date, value: val});
            if(database.timeseries[key].data.length > database.timeseries[key].limit) {
              database.timeseries[key].data.shift();
            }
          }

          // Update charts
          if(charts.timeseries[key] && charts.timeseries[key].chart) {
            var columns0 = ['x'],
                columns1 = [charts.timeseries[key].label];

            database.timeseries[key].data.forEach(function(item) {
              columns0.push(new Date(item.date));
              columns1.push(item.value);
            });
            charts.timeseries[key].chart.load({columns: [columns0, columns1]});
          }
        });
      }

      // If type is error then
      if(message.type === 'error') {
        console.error(message);
      }
    });
  };
};

// Run app
$(document).ready(function() {
  app();
});