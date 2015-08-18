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
    utilex  = require('utilex');

var ARGS      = utilex.args(),
    NODE_PORT = process.env.NODE_PORT || '3000',
    NATS_URL  = ARGS['nats-url']      || 'http://localhost:8222';

// Handle errors - for preventing websocket issues
process.on('uncaughtException', function (err) {
  console.error(err);
});

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

// Init server
var app = express();
app.use(express.static('public'));

// Handles data route
app.get('/data/:type', function(req, res) {
  var type = req.params.type || null;

  if(!type) {
    return res.json({});
  }
  else if(['varz', 'connz', 'routez', 'subscriptionsz'].indexOf(type) === -1) {
    return res.status(400).json({code: 400, message: 'bad request'});
  }

  // Fetch data
  fetchData(util.format('%s/%s', NATS_URL, type), function(err, result) {
    if(err) {
      return res.status(500).json({code: 500, message: err.message});
    }
    return res.json(result);
  });
});

// Init server
app.listen(NODE_PORT);
console.log(util.format('Web server listening at %s', NODE_PORT));
console.log(util.format('Fetching data from %s', NATS_URL));