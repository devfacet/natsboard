/*
 * NATSboard
 * Copyright (c) 2015 Fatih Cetinkaya (http://github.com/fatihcode/natsboard)
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

  var NATS_MON_URL = app.get('NATS_MON_URL'),
      router       = express.Router(),
      client       = new Client(),
      natsMonTypes = ['varz', 'connz', 'routez', 'subscriptionsz'];

  // Handles nats route
  router.get('/nats/:type', function(req, res) {

    var type  = req.params.type || null,
        query = req.url ? req.url.split('?').splice(1).join('?') : null;

    // Check type
    if(!type) {
      return res.json({});
    }
    else if(natsMonTypes.indexOf(type) === -1 && type !== '_all') {
      return res.status(400).json({code: 400, message: 'bad request'});
    }

    // Fetch data
    var fetchDataFunc = 'fetchData',
        fetchDataUrl  = util.format('%s/%s?%s', NATS_MON_URL, type, query);

    // If type is all then
    if(type === '_all') {
      fetchDataFunc = 'fetchDataAll';
      fetchDataUrl  = NATS_MON_URL;
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