node-http-proxy-limiter
=======================

A very quick node.js rate limiting HTTP proxy based on [node-http-proxy](https://github.com/nodejitsu/node-http-proxy) and [node_redis](https://github.com/mranney/node_redis). It uses the proxy model with latency (buffers) to allow dependent operations to complete without impacting timing.
It allows basic API rate limiting based on a key contained in the request ex. URL query param.


Usage
---

	npm install http-proxy
	npm install redis

	node limiter.js


Example
---




Acknowledgements
---

 * [node-http-proxy](https://github.com/nodejitsu/node-http-proxy)
 * [node_redis](https://github.com/mranney/node_redis)
 * [node-rate-limiter-proxy](https://github.com/joshdevins/node-rate-limiter-proxy)