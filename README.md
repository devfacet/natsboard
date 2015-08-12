## NATSboard

[![NPM][npm-image]][npm-url] [![Build Status][travis-image]][travis-url]

Dashboard for monitoring NATS. It provides real-time information from NATS server.

![docker-vmi-builder.sh](public/img/ss-natsboard-1.png)

### Installation

```
npm install natsboard
```

### Usage

[gnatsd server](http://nats.io/download/) **should** be running with `-m` parameter.

```
gnatsd -m 8222
npm start
```
```
gnatsd -m 12345
npm start -- --nats-url http://localhost:12345
```

### License

Licensed under The MIT License (MIT)  
For the full copyright and license information, please view the LICENSE.txt file.

[npm-url]: http://npmjs.org/package/natsboard
[npm-image]: https://badge.fury.io/js/natsboard.png

[travis-url]: https://travis-ci.org/cmfatih/natsboard
[travis-image]: https://travis-ci.org/cmfatih/natsboard.svg?branch=master