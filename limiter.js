var httpProxy = require('http-proxy'),
    url = require('url'),
    redis = require('redis'),
    time_window = 30, // <-- SET TIME WINDOW
    limit = 10, // <-- SET LIMIT PER TIME WINDOW
    local_port = 4000, // <-- SET PROXY SERVER PORT 
    remote_host = 'localhost', // <-- SET REMOTE SERVER HOST
    remote_port = 3000, // <-- SET REMOTE SERVER PORT
    redisClient = redis.createClient(6379, 'localhost'); // <-- SET REDIS SERVER


redisClient.on("error", function(err) {
    console.log("Debug: Redis Error " + err);
});



httpProxy.createServer(function(req, res, proxy) {
    var buffer = httpProxy.buffer(req),
        url_parts = url.parse(req.url, true),
        query = url_parts.query,
        key = "RL:" + query.AccessKey; // <-- SET RATE LIMITING KEY

    if (!redisClient.connected) {
        console.log("Debug: Cannot connect to Redis");
        res.writeHead(503);
        res.end();
        return;
    }


    redisClient.multi().hincrby(key, "c", 1).ttl(key).exec(function(err, result) {


        if (err) {
            res.writeHead(503);
            res.end();
            return;
        }

        var count = result[0],
            ttl = result[1];

        var updatedttl = ttl == -1 ? time_window : ttl;

        var headers_stat = {
            'X-RateLimit-Limit': limit,
            'X-RateLimit-Remaining': count > limit ? 0 : limit - count,
            'X-RateLimit-Reset': Math.round(new Date().getTime() / 1000) + updatedttl
        };

        //TTL has expired
        if (ttl == -1) {

            //optimistic locking
            redisClient.watch(key);

            redisClient.multi().hset(key, "c", 1).expire(key, time_window).exec(function(err, result) {

                if (err) {
                    res.writeHead(503);
                    res.end();
                    return;
                }

                //race condition if result=null

                if (!result && (count > limit)) {

                    //console.log("Debug: TTL expired, hit race condition and over limit, reject away...");
                    res.writeHead(429, headers_stat);
                    res.end();
                    return;

                }

                if (result || (!result && (count <= limit))) {
                    //console.log("Debug: TTL expired, attempt to reset and proxy on...");

                    var _writeHead = res.writeHead;
                    res.writeHead = function(statusCode, headers) {
                        var headers_merged = headers;
                        for (attrname in headers_stat) {
                            headers_merged[attrname] = headers_stat[attrname];
                        }
                        _writeHead.call(res, statusCode, headers_merged);
                    }

                    proxy.proxyRequest(req, res, {
                        port: remote_port,
                        host: remote_host,
                        buffer: buffer
                    });

                }

            });

        } else {

            //TTL has not expired

            if (count <= limit) {

                //console.log("Debug: TTL not expired, count below limit, proxy on...");

                var _writeHead = res.writeHead;
                res.writeHead = function(statusCode, headers) {
                    var headers_merged = headers;
                    for (attrname in headers_stat) {
                        headers_merged[attrname] = headers_stat[attrname];
                    }
                    _writeHead.call(res, statusCode, headers_merged);
                }

                proxy.proxyRequest(req, res, {
                    port: remote_port,
                    host: remote_host,
                    buffer: buffer
                });

            } else {

                //console.log("Debug: TTL not expired, count above limit, reject away...");
                res.writeHead(429, headers_stat);
                res.end();
            }

        }

    });

}).listen(local_port);
