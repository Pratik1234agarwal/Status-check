/*
* Create and export Configuration file

*/

// Container for all the enviornments]

let environments = {};

// Staging (default) enviorement
environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
  hashingSecret: 'Secretofhash',
};

// Production enviorement
environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: 'production',
  hashingSecret: 'Secretofhash',
};

// Determine which enviorement needs to be exported
const currentEnvironment =
  typeof process.env.NODE_ENV !== 'string'
    ? process.env.NODE_ENV.toLowerCase()
    : '';

// Check that the current enviorenment is one of the above enviorenment, set it to that
// else set it to the default that is staging
let environmentToExport =
  typeof environments[currentEnvironment] === 'object'
    ? environments[currentEnvironment]
    : 'staging';

// export the env.
module.exports = environments[environmentToExport];
