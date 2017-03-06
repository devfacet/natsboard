/*
 * NATSboard
 * For the full copyright and license information, please view the LICENSE.txt file.
 */

/* jslint node: true, sub: true */
'use strict';

var express = require('express'),
    util    = require('util'),
    utilex  = require('utilex'),
    ws      = require('nodejs-websocket'),
    path    = require('path');

var ARGS         = utilex.args(),
    APP_PATH     = path.resolve(path.join(__dirname, '..')),
    NODE_PORT    = process.env.NODE_PORT    || ARGS['port']         || '3000',
    NODE_PORTWS  = process.env.NODE_PORTWS  || ARGS['port-ws']      || parseInt(NODE_PORT)+1,
    NATS_MON_URL = process.env.NATS_MON_URL || ARGS['nats-mon-url'] || 'http://localhost:8222';

// Handle errors - for preventing websocket issues
process.on('uncaughtException', function (err) {
  console.error(err);
});

// Init server
var app = express(),
    ws  = ws.createServer();

app.set('NODE_PORT',    NODE_PORT);    // server port
app.set('NODE_PORTWS',  NODE_PORTWS);  // websocket port
app.set('NATS_MON_URL', NATS_MON_URL); // nats monitoring url
app.set('WS',           ws);           // websocket server

app.use(require('./metrics')(app));  // metrics
app.use(require('./routes')(app));   // routes
app.use(express.static(path.join(APP_PATH, 'public'))); // static file serving

// Start web server
app.listen(NODE_PORT);
console.log(util.format('Web server listening at %s', NODE_PORT));

// Start ws server
ws.listen(NODE_PORTWS);
console.log(util.format('Websocket server listening at %s', NODE_PORTWS));