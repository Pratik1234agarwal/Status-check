/*
* Primary file for the api


*/

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const { type } = require('os');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./lib/config');
const fs = require('fs');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

// Instantiating the http server
const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

// Start the server
httpServer.listen(config.httpPort, () => {
  console.log(`Server is listening on port ${config.httpPort} `);
});

// Instantiate the https server
const httpsServerOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem'),
};
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});

// Start the https server

httpsServer.listen(config.httpsPort, () => {
  console.log(`Server is listening on port ${config.httpsPort} `);
});

// All the server logic for both the http and https server
function unifiedServer(req, res) {
  // Get the url and parse it
  let parsedUrl = url.parse(req.url, true);

  //Get the path from the url
  let path = parsedUrl.pathname;
  let trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  let queryString = parsedUrl.query;

  // Get the http method
  let method = req.method.toLowerCase();

  // Get the headers as a object
  let headers = req.headers;

  // Get the payload if any
  let decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', function (data) {
    buffer += decoder.write(data);
  });
  req.on('end', function () {
    buffer += decoder.end();

    // Choose the handler this request should go to. If one is not found it
    // should go to notFound handler\
    let chosenHandler =
      typeof router[trimmedPath] !== 'undefined'
        ? router[trimmedPath]
        : handlers.notFound;

    // Counstruct the data object to send to the handler
    let data = {
      trimmedPath: trimmedPath,
      queryString: queryString,
      method: method,
      headers: headers,
      payload: helpers.parseJsonToObject(buffer),
    };

    // Route the request to the handler specified in the handler
    chosenHandler(data, function (statusCode, payload) {
      // Use the status code sent by the router or the default status code
      statusCode = typeof statusCode == 'number' ? statusCode : 200;

      // Use the payload called back by the handler;
      payload = typeof payload === 'object' ? payload : {};

      // Convert the payload into a string
      let payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log the return request
      console.log('Returning this response: ', statusCode, payloadString);
    });
  });
}

// Define a request Router
let router = {
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
};
