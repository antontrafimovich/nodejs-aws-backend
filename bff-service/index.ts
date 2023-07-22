import { createServer, request as requestHTTP } from 'node:http';
import { request as requestHTTPS } from 'node:https';
import 'dotenv/config';

const port = 4000;

const getProtocolFromUrl = (url: string): 'http' | 'https' => {
  return url?.split(':')[0] as 'http' | 'https';
};

const getRequester = (protocol: 'http' | 'https') => {
  if (protocol === 'http') {
    return requestHTTP;
  }

  return requestHTTPS;
};

createServer((req, res) => {
  const url = req.url;
  const [, service, ...restUrl] = url?.split('/');
  const serviceUrl = process.env[service];

  if (!serviceUrl) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Cannot process request');
    return;
  }

  const protocol = getProtocolFromUrl(serviceUrl);

  const serviceRequest = getRequester(protocol)(
    `${serviceUrl}/${restUrl.join('/')}`,
    {
      method: req.method,
      headers: {
        'Content-Type': ['PUT', 'GET'].includes(req.method)
          ? 'application/json'
          : null,
        Authorization: req.headers['authorization'] ?? null,
      },
    },
    (response) => {
      res.writeHead(response.statusCode || 502, {
        ...response.headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': '*',
      });
      response.pipe(res).on('error', console.error);
    },
  );

  req.pipe(serviceRequest);
}).listen(port, () => {
  console.log('Server is running on port 4000');
});
