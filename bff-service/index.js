"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_http_1 = require("node:http");
require("dotenv/config");
var port = 3000;
(0, node_http_1.createServer)(function (req, res) {
    var url = req.url;
    var _a = url === null || url === void 0 ? void 0 : url.split('/'), service = _a[0], path = _a[1];
    console.log(process.env);
    var serviceUrl = process.env[service];
    if (!serviceUrl) {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Cannot process request');
        return;
    }
    var options = {
        host: serviceUrl,
        path: path,
        method: req.method,
        headers: req.headers,
    };
    var serviceRequest = (0, node_http_1.request)(options, function (response) {
        res.writeHead(response.statusCode || 502, response.headers);
        response.pipe(res);
    });
    req.pipe(serviceRequest);
}).listen(port, function () {
    console.log('Server is running on port 3000');
});
