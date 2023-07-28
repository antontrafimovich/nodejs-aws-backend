import 'dotenv/config';

import axios from 'axios';
import { createServer, RequestListener } from 'node:http';

const port = 4000;

const getResponseCommonHeaders = () => {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*',
  };
};

const useAuth = (next: RequestListener): RequestListener => {
  return async (req, res) => {
    if (req.method === 'OPTIONS') {
      await next(req, res);
      return;
    }

    if (!req.headers['authorization']) {
      res.writeHead(401, {
        'Content-Type': 'application/json',
        ...getResponseCommonHeaders(),
      });
      res.end(
        JSON.stringify({
          statusCode: 401,
          message: 'User is not authorized',
        }),
      );
      return;
    }

    const token = req.headers['authorization'] as string;

    const [, tokenBase64] = token.split(' ');

    const data = Buffer.from(tokenBase64, 'base64').toString('utf-8');

    const [login, password] = data.split(':');

    if (login !== 'antontrafimovich' || password !== 'TEST_PASSWORD') {
      res.writeHead(403, {
        'Content-Type': 'application/json',
        ...getResponseCommonHeaders(),
      });
      res.end(
        JSON.stringify({
          statusCode: 403,
          message: 'Provided creds are not suitable',
        }),
      );
      return;
    }

    return next(req, res);
  };
};

const useCache = (next: RequestListener): RequestListener => {
  let cache: { date: number; data: unknown } = {
    date: null,
    data: null,
  };

  return async (req, res) => {
    if (!req.url.startsWith('/products/products') || req.method !== 'GET') {
      await next(req, res);
      return;
    }

    const { date, data } = cache;

    const currentDate = Date.now();

    if (date !== null && currentDate - date < 2 * 60 * 1000) {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        ...getResponseCommonHeaders(),
      });
      res.end(JSON.stringify(data));
      return;
    }

    const url = req.url;
    const [, service, ...restUrl] = url?.split('/');
    const serviceUrl = process.env[service];

    console.log(service);

    if (!serviceUrl) {
      res.writeHead(502, {
        'Content-Type': 'text/plain',
        ...getResponseCommonHeaders(),
      });
      res.end('Cannot process request');
      return;
    }

    let response;

    try {
      response = await axios.get(`${serviceUrl}/${restUrl.join('/')}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: req.headers['authorization'] ?? null,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': '*',
          'Access-Control-Allow-Headers': '*',
        },
      });
    } catch (err) {
      res.writeHead(err.response.status, {
        ...err.response.headers,
        ...getResponseCommonHeaders(),
      });
      res.end(
        err.response.headers === 'text/plain'
          ? err.response.data
          : JSON.stringify(err.response.data),
      );
      return;
    }

    cache = {
      data: response.data,
      date: Date.now(),
    };

    res.writeHead(response.status || 502, getResponseCommonHeaders());

    res.end(JSON.stringify(response.data));
  };
};

createServer(
  useAuth(
    useCache(async (req, res) => {
      const url = req.url;
      const [, service, ...restUrl] = url?.split('/');
      const serviceUrl = process.env[service];

      if (!serviceUrl) {
        res.writeHead(502, {
          'Content-Type': 'text/plain',
          ...getResponseCommonHeaders(),
        });
        res.end('Cannot process request');
        return;
      }

      let response;

      try {
        response = await axios({
          method: req.method,
          headers: {
            'Content-Type': ['PUT', 'GET', 'POST'].includes(req.method)
              ? 'application/json'
              : null,
            Authorization: req.headers['authorization'] ?? null,
          },
          url: `${serviceUrl}/${restUrl.join('/')}`,
          data: ['GET', 'POST'].includes(req.method) ? req : undefined,
        });
      } catch (err) {
        res.writeHead(err.response.status, {
          ...err.response.headers,
          ...getResponseCommonHeaders(),
        });
        res.end(
          err.response.headers === 'text/plain'
            ? err.response.data
            : JSON.stringify(err.response.data),
        );
        return;
      }

      res.writeHead(response.status || 502, getResponseCommonHeaders());

      res.end(JSON.stringify(response.data));
    }),
  ),
).listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
