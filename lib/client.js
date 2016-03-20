/*
 * NATSboard
 * Copyright (c) 2015 Fatih Cetinkaya (http://github.com/fatihcode/natsboard)
 * For the full copyright and license information, please view the LICENSE.txt file.
 */

/* jslint node: true */
'use strict';

var util    = require('util'),
    utilex  = require('utilex'),
    request = require('request');

module.exports = function() {

  var natsMonTypes = ['varz', 'connz', 'routez', 'subscriptionsz'],
      cacheData    = {fetchData: {}},
      cacheOn      = true;

  // Fetches data
  var fetchData = function fetchData(url, cb) {

    if(typeof cb !== 'function') {
      throw new Error('invalid callback function');
    }
    else if(typeof url !== 'string') {
      return cb(new Error('invalid url'));
    }

    // Check cache
    if(cacheOn) {
      var timeout = (new Date()).getTime() - 500;
      if(cacheData.fetchData[url] && cacheData.fetchData[url].timestamp >= timeout) {
        //console.log(util.format('data from cache for %s', url)); // for debug
        return cb(null, cacheData.fetchData[url].data);
      }
    }

    // Make request
    request(url, function(err, res) {
      if(err) {
        return cb(new Error('connection error: ' + err.message));
      }

      // Parse data
      var data;
      try {
        data = JSON.parse(res.body);
      }
      catch(e) {
        return cb(new Error('invalid content'));
      }

      // Cache it
      cacheData.fetchData[url] = {
        timestamp: (new Date()).getTime(),
        data     : data
      };
      //console.log(util.format('data from server for %s', url)); // for debug

      return cb(null, data);
    });
  };

  // Fetches all data
  var fetchDataAll = function fetchDataAll(url, cb) {

    // Create tasker
    var tasker = utilex.tasker();
    tasker.results = {}; // wrapper for results

    // Add tasks for types
    natsMonTypes.forEach(function(type) {
      tasker.add(type);
    });

    // Run tasks
    tasker.run(function(task, next) {

      // Fetch data
      fetchData(util.format('%s/%s', url, task), function(err, result) {
        if(err) {
          //return cb(err);
          return next(); // call next task
        }

        // Prepare result
        var time = result.now ? (new Date(result.now)).getTime() : (new Date()).getTime();
        result._time = time;
        tasker.results[task] = result;

        return next(); // call next task
      });
    }, function() {
      // Tasks are done
      return cb(null, tasker.results);
    });
  };

  // Toggles cache
  var caching = function caching(val) {
    if(typeof val !== 'undefined') {
      cacheOn = val || false;
    }
    return cacheOn;
  };

  // Return
  return {
    caching:      caching,
    fetchData:    fetchData,
    fetchDataAll: fetchDataAll
  };
};