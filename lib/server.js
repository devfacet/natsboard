/*
 * NATSboard
 * Copyright (c) 2015 Fatih Cetinkaya (http://github.com/cmfatih/natsboard)
 * For the full copyright and license information, please view the LICENSE.txt file.
 */

/* jslint node: true */
'use strict';

var express = require('express'),
    util    = require('util'),
    request = require('request'),
    ws      = require('nodejs-websocket'),
    utilex  = require('utilex');

var ARGS        = utilex.args(),
    NODE_PORT   = process.env.NODE_PORT   || '3000',
    NODE_PORTWS = process.env.NODE_PORTWS || parseInt(NODE_PORT)+1,
    NATS_URL    = ARGS['nats-url']        || 'http://localhost:8222';

// Handle errors
process.on('uncaughtException', function (err) {
  console.log(err);
});

// Init server
var app = express();
app.use(express.static('public'));
app.listen(NODE_PORT);
console.log(util.format('Web server listening at %s', NODE_PORT));

// Init ws
var wsserver = ws.createServer();
wsserver.listen(NODE_PORTWS);
console.log(util.format('Websocket server listening at %s', NODE_PORTWS));

// Fetches data
var fetchData = function fetchData(url, cb) {
  request(url, function(err, res) {
    if(err) {
      return cb(new Error('connection error: ' + err.message));
    }

    var data;
    try {
      data = JSON.parse(res.body);
    }
    catch(e) {
      return cb(new Error('invalid content'));
    }
    return cb(null, data);
  });
};

// Runs fetching data
var runner = function runer() {

  var running = false;

  setInterval(function() {
    // If it is not running then
    if(!running) {
      running = true;

      // Fetch data
      fetchData(util.format('%s/varz', NATS_URL), function(err, result) {
        if(err) {
          console.log(err);
        }
        else {
          // Send data
          wsserver.connections.forEach(function(client) {
            client.sendText(JSON.stringify({type: 'varz', date: new Date().getTime(), data: result}));
          });
        }
        running = false;
      });
    }
  }, 1000);
};
runner();
console.log(util.format('Fetching data from %s', NATS_URL));