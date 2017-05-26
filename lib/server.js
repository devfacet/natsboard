/*
 * NATSboard
 * For the full copyright and license information, please view the LICENSE.txt file.
 */

/* jslint node: true, sub: true */
'use strict';




var express = require('express'),
    util    = require('util'),
    utilex  = require('utilex'),
    path    = require('path'),
    http = require('http'),
    WebSocket = require('ws');

var ARGS         = utilex.args(),
    APP_PATH     = path.resolve(path.join(__dirname, '..')),
    NODE_PORT    = process.env.NODE_PORT    || ARGS['port']         || '3000',
    NATS_MON_URL = process.env.NATS_MON_URL || ARGS['nats-mon-url'] || 'http://localhost:8222';

// Handle errors - for preventing websocket issues
process.on('uncaughtException', function (err) {
  console.error(err);
});

// Init server
var app = express(),
    server = http.createServer(app),
    ws = new WebSocket.Server({ server });

app.set('NODE_PORT',    NODE_PORT);    // server port
app.set('NATS_MON_URL', NATS_MON_URL); // nats monitoring url
app.set('WS',           ws);           // websocket server

app.use(require('./metrics')(app));  // metrics
app.use(require('./routes')(app));   // routes
app.use(express.static(path.join(APP_PATH, 'public'))); // static file serving

// Start web server
// server.listen(NODE_PORT);
server.listen(NODE_PORT, function listening() {
  console.log('Listening on %d', server.address().port);
});
console.log(util.format('Web server listening at %s', NODE_PORT));
