import { createServer, request as requestHTTP } from 'node:http';
import { request as requestHTTPS } from 'node:https';
import 'dotenv/config';

const port = 4000;

const getRequester = (protocol) => {
  if (protocol === 'http') {
    return requestHTTP;
  }

  return requestHTTPS;
};

const isStatic = (url) => {
  const [, service, path] = url?.split('/');
};

createServer((req, res) => {
  const url = req.url;
  console.log(url);
  const [, service, ...rest] = url?.split('/');
  const serviceUrl = process.env[service];

  if (!serviceUrl) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Cannot process request');
    return;
  }

  const [protocol] = serviceUrl?.split(':');

  console.log(`${serviceUrl}/${rest.join('/')}`);

  const serviceRequest = getRequester(protocol)(
    `${serviceUrl}/${rest.join('/')}`,
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
