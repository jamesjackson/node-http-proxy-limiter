node-http-proxy-limiter
=======================

A very quick node.js rate limiting HTTP proxy based on [node-http-proxy](https://github.com/nodejitsu/node-http-proxy) and [node_redis](https://github.com/mranney/node_redis). It uses the proxy model with latency (buffers) to allow dependent operations to complete without impacting timing.
It allows basic API rate limiting based on a key contained in the request ex. URL query param.


Usage
---

	git clone https://github.com/jamesjackson/node-http-proxy-limiter.git

	npm install http-proxy
	npm install redis

	node limiter.js


Example
---

Request within limits:

	curl -v  http://localhost:4000/test?AccessKey=12345
 
	< HTTP/1.1 200 OK
	< content-type: text/plain
	< date: Tue, 18 Sep 2012 01:49:28 GMT
	< connection: close
	< transfer-encoding: chunked
	< X-RateLimit-Limit: 10
	< X-RateLimit-Remaining: 2
	< X-RateLimit-Reset: 1347932978



Request outside limits:

	curl -v  http://localhost:4000/test?AccessKey=12345

	< HTTP/1.1 429 Too Many Requests
	< X-RateLimit-Limit: 10
	< X-RateLimit-Remaining: 0
	< X-RateLimit-Reset: 1347932978
	< Date: Tue, 18 Sep 2012 01:49:31 GMT
	< Connection: keep-alive
	< Transfer-Encoding: chunked



Acknowledgements
---

 * [node-http-proxy](https://github.com/nodejitsu/node-http-proxy)
 * [node_redis](https://github.com/mranney/node_redis)
 * [node-rate-limiter-proxy](https://github.com/joshdevins/node-rate-limiter-proxy)