/*
 * NATSboard
 * Copyright (c) 2015 Fatih Cetinkaya (http://github.com/cmfatih/natsboard)
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

  var NATS_URL     = app.get('NATS_URL'),
      router       = express.Router(),
      client       = new Client(),
      natsMonTypes = ['varz', 'connz', 'routez', 'subscriptionsz'];

  // Handles nats route
  router.get('/nats/:type', function(req, res) {

    var type = req.params.type || null;

    // Check type
    if(!type) {
      return res.json({});
    }
    else if(natsMonTypes.indexOf(type) === -1 && type !== '_all') {
      return res.status(400).json({code: 400, message: 'bad request'});
    }

    // Fetch data
    var fetchDataFunc = 'fetchData',
        fetchDataUrl  = util.format('%s/%s', NATS_URL, type);

    // If type is all then
    if(type === '_all') {
      fetchDataFunc = 'fetchDataAll';
      fetchDataUrl  = NATS_URL;
    }

    client[fetchDataFunc](fetchDataUrl, function(err, result) {
      if(err) {
        if(err.message && err.message.indexOf('ECONNREFUSED') !== -1) {
          return res.status(503).json({code: 503, message: err.message});
        }
        else {
          return res.status(500).json({code: 500, message: err.message});
        }
      }
      return res.json(result);
    });

  });

  return router;
};