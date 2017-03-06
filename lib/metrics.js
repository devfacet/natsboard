/*
 * NATSboard
 * For the full copyright and license information, please view the LICENSE.txt file.
 */

/* jslint node: true */
'use strict';

var util    = require('util'),
    express = require('express'),
    Client  = require('./client');

module.exports = function(app) {

  if(!app || typeof app.get !== 'function') {
    throw new Error('invalid app instance');
  }

  var NATS_MON_URL  = app.get('NATS_MON_URL'),
      WS            = app.get('WS'),
      router        = express.Router(),
      client        = new Client(),
      serverMetrics = {
        varz: {
          connections:    [],
          mem:            [],
          cpu:            [],
          slow_consumers: [],
          in_msgs:        [],
          out_msgs:       [],
          in_bytes:       [],
          out_bytes:      []
        }
      },
      metricRates = {
        varz: {
          connections:    [],
          mem:            [],
          cpu:            [],
          slow_consumers: [],
          in_msgs:        [],
          out_msgs:       [],
          in_bytes:       [],
          out_bytes:      []
        }
      };

  // Disable client caching
  client.caching(false);

  // Gets metrics
  var getMetrics = function getMetrics() {
    return serverMetrics;
  };

  // Gets rates
  var getRates = function getRates() {
    return metricRates;
  };

  // Processes data
  var processData = function processData(url, cb) {

    if(typeof cb !== 'function') {
      throw new Error('invalid callback function');
    }
    else if(typeof url !== 'string') {
      return cb(new Error('invalid url'));
    }

    // Fetch all data
    client.fetchDataAll(url, function(err, result) {
      if(err) {
        return cb(err);
      }

      // Iterate metrics
      Object.keys(serverMetrics).forEach(function(type) {
        if(result[type]) {
          Object.keys(serverMetrics[type]).forEach(function(metric) {
            if(typeof result[type][metric] !== 'undefined') {

              var metricTime = result[type]._time || new Date().getTime();

              // Calculate rate
              if(metricRates[type] && typeof metricRates[type][metric] !== 'undefined') {
                var metricRate = result[type][metric] || 0,
                    metricLen  = serverMetrics[type][metric].length;

                // If there is a metric then
                if(metricLen) {
                  if(['in_msgs', 'out_msgs', 'in_bytes', 'out_bytes'].indexOf(metric) !== -1) {
                    // TODO: There is no guarantee that metrics will be per second with this code
                    //       so add timestamp to metrics and calculate base on it.
                    var metricLast = serverMetrics[type][metric][serverMetrics[type][metric].length-1].value || 0;
                    metricRate = metricRate-metricLast;
                  }
                }

                // Add rate
                metricRates[type][metric].push({timestamp: metricTime, value: metricRate});
                // If length is greater then limit
                if(metricRates[type][metric].length > 5) {
                  metricRates[type][metric].shift(); // remove first element
                }
              }

              // Add metric
              serverMetrics[type][metric].push({timestamp: metricTime, value: result[type][metric]});
              // If length is greater then limit
              if(serverMetrics[type][metric].length > 5) {
                serverMetrics[type][metric].shift(); // remove first element
              }
            }
          });
        }
      });

      return cb();
    });
  };

  // Fetches data periodically
  var fetcher = function fetcher(url) {
    var running = false;
    setInterval(function() {
      if(!running) {
        running = true;
        processData(url, function(err) {
          if(err) {
            console.error(err);
          }
          running = false;
        });
      }
    }, 1000);
  };

  // Pushes data periodically
  var pusher = function pusher() {
    var running = false;
    setInterval(function() {
      if(!running) {
        running = true;
        // Send data
        WS.connections.forEach(function(client) {
          client.sendText(JSON.stringify({
            type:  'rates',
            rates: getRates()
          }));
        });
        running = false;
      }
    }, 1000);
  };

  // Start fetcher
  fetcher(NATS_MON_URL);
  console.log(util.format('Fetching data from %s', NATS_MON_URL));

  // Start pusher
  pusher();
  console.log('Pushing data to websocket connections...');

  // Handles metrics route
  router.get('/metrics/metrics', function(req, res) {
    return res.json(getMetrics());
  });

  // Handles metrics route
  router.get('/metrics/rates', function(req, res) {
    return res.json(getRates());
  });

  // Return
  return router;
};