/*
 * NATSboard
 * Copyright (c) 2015 Fatih Cetinkaya (http://github.com/cmfatih/natsboard)
 * For the full copyright and license information, please view the LICENSE.txt file.
 */

/* jslint node: true, sub: true */
'use strict';

var express = require('express'),
    util    = require('util'),
    utilex  = require('utilex'),
    ws      = require('nodejs-websocket');

var ARGS        = utilex.args(),
    NODE_PORT   = process.env.NODE_PORT   || ARGS['port']     || '3000',
    NODE_PORTWS = process.env.NODE_PORTWS || ARGS['port-ws']  || parseInt(NODE_PORT)+1,
    NATS_URL    = process.env.NATS_URL    || ARGS['nats-url'] || 'http://localhost:8222';

// Handle errors - for preventing websocket issues
process.on('uncaughtException', function (err) {
  console.error(err);
});

// Init server
var app = express(),
    ws  = ws.createServer();

app.set('NODE_PORT',   NODE_PORT);   // server port
app.set('NODE_PORTWS', NODE_PORTWS); // websocket port
app.set('NATS_URL',    NATS_URL);    // nats monitoring url
app.set('WS',          ws);          // websocket server

app.use(require('./metrics')(app).router); // metrics
app.use(require('./routes')(app));   // routes
app.use(express.static('public'));   // static file serving

// Start web server
app.listen(NODE_PORT);
console.log(util.format('Web server listening at %s', NODE_PORT));

// Start ws server
ws.listen(NODE_PORTWS);
console.log(util.format('Websocket server listening at %s', NODE_PORTWS));