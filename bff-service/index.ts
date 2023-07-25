import 'dotenv/config';

import axios from 'axios';
import { createServer, RequestListener } from 'node:http';

const port = 4000;

const useCache = (next: RequestListener): RequestListener => {
  let cache: { date: number; data: unknown } = {
    date: null,
    data: null,
  };

  return async (req, res) => {
    console.log(req.url);

    if (!req.url.startsWith('/products/products') || req.method !== 'GET') {
      await next(req, res);
      return;
    }

    const { date, data } = cache;

    const currentDate = Date.now();

    if (date !== null && currentDate - date < 2 * 60 * 1000) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    const url = req.url;
    const [, service, ...restUrl] = url?.split('/');
    const serviceUrl = process.env[service];

    if (!serviceUrl) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Cannot process request');
      return;
    }

    let response;

    try {
      response = await axios.get(`${serviceUrl}/${restUrl.join('/')}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: req.headers['authorization'] ?? null,
        },
      });
    } catch (err) {
      res.writeHead(err.response.status, err.response.headers);
      res.end(JSON.stringify(err.response.data));
      return;
    }

    cache = {
      data: response.data,
      date: Date.now(),
    };

    res.writeHead(response.status || 502, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
    });

    res.end(JSON.stringify(response.data));
  };
};

createServer(
  useCache(async (req, res) => {
    const url = req.url;
    const [, service, ...restUrl] = url?.split('/');
    const serviceUrl = process.env[service];

    if (!serviceUrl) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Cannot process request');
      return;
    }

    let response;

    try {
      response = await axios({
        method: req.method,
        headers: {
          'Content-Type': ['PUT', 'GET'].includes(req.method)
            ? 'application/json'
            : null,
          Authorization: req.headers['authorization'] ?? null,
        },
        url: `${serviceUrl}/${restUrl.join('/')}`,
        data: req.method === 'PUT' ? req : undefined,
      });
    } catch (err) {
      res.writeHead(err.response.status, err.response.headers);
      res.end(JSON.stringify(err.response.data));
      return;
    }

    res.writeHead(response.status || 502, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
    });

    res.end(JSON.stringify(response.data));
  }),
).listen(port, () => {
  console.log('Server is running on port 4000');
});
