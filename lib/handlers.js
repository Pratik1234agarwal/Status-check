/*
 * Request handler
 */

const { Z_DATA_ERROR } = require('zlib');

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Define the handlers
let handlers = {};

// User handler
handlers.users = function (data, callback) {
  let acceptableMethods = ['post', 'put', 'get', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for users sub method
handlers._users = {};

// Users -> post
// Required data: firstName, lastName, phone, password, tosAgreement
// optional data: none
handlers._users.post = function (data, callback) {
  // Check that all required fields are filled out
  let firstName =
    typeof data.payload.firstName === 'string' &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  let lastName =
    typeof data.payload.lastName === 'string' &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  let phone =
    typeof data.payload.phone === 'string' &&
    data.payload.phone.trim().length === 10
      ? data.payload.phone.trim()
      : false;
  let password =
    typeof data.payload.password === 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  let tosAgreement =
    typeof data.payload.tosAgreement === 'boolean' &&
    data.payload.tosAgreement === true
      ? true
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure user already doesn't exist
    _data.read('users', phone, function (err, data) {
      if (err) {
        // Hash the password
        let hashedPassword = helpers.hash(password);

        // Create the user object
        if (hashedPassword) {
          let userObject = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            tosAgreement: true,
          };

          // Store the user
          _data.create('users', phone, userObject, function (err) {
            if (!err) {
              callback(200, { msg: 'User successfully added' });
            } else {
              console.log(err);
              callback(500, { error: 'Could not create the new user' });
            }
          });
        } else {
          callback(400, { Error: 'Password not of the correct format' });
        }
      } else {
        callback(400, { Error: 'User Already exist with this phone number' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required fields' });
  }
};

// Users -> get
// Required Data : phone
// optional data : none
handlers._users.get = function (data, callback) {
  // Check phone is valid
  const phone =
    typeof data.queryString.phone === 'string' &&
    data.queryString.phone.trim().length === 10
      ? data.queryString.phone.trim()
      : false;

  if (phone) {
    // Get the token from the header
    let token =
      typeof data.headers.token === 'string' ? data.headers.token : false;

    // Check the token is valid for the given phone number
    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        _data.read('users', phone, function (err, data) {
          if (!err && data) {
            // Remove the hashed password
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404, { Error: "Number doesn't exist" });
          }
        });
      } else {
        callback(403, { Error: 'Missing token in header or token invalid' });
      }
    });
    // Look up the user
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Users -> put
// Required Data -> phone
// Optional data -> firstName, lastName, password . (Atleast one of this must be specified)
handlers._users.put = function (data, callback) {
  // Check for the required field
  const phone =
    typeof data.payload.phone === 'string' &&
    data.payload.phone.trim().length === 10
      ? data.payload.phone.trim()
      : false;

  // Check for the optional field
  let firstName =
    typeof data.payload.firstName === 'string' &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  let lastName =
    typeof data.payload.lastName === 'string' &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  let password =
    typeof data.payload.password === 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  // Error if the phone is invalid
  if (phone) {
    if (firstName || lastName || password) {
      // Get the token from the header
      let token =
        typeof data.headers.token === 'string' ? data.headers.token : false;

      handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
        if (tokenIsValid) {
          // Lookup user
          _data.read('users', phone, function (error, userData) {
            if (!error && userData) {
              // Update the field necessary
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }
              // Store the new Data
              _data.update('users', phone, userData, function (err) {
                if (!err) {
                  callback(200, { msg: 'Information updated' });
                } else {
                  console.log(err);
                  callback(500, { Error: 'Could not update the error' });
                }
              });
            } else {
              callback(400, { Error: 'Specified user does not exist' });
            }
          });
        } else {
          callback(403, { Error: 'Missing token in header or token invalid' });
        }
      });
    } else {
      callback(400, { Error: 'Missing fields to update' });
    }
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Users -> delete
// Required field -> Phone
// TODO: Delete all related files
handlers._users.delete = function (data, callback) {
  // Check phone is valid
  const phone =
    typeof data.queryString.phone === 'string' &&
    data.queryString.phone.trim().length === 10
      ? data.queryString.phone.trim()
      : false;

  if (phone) {
    // Get the token from the header
    let token =
      typeof data.headers.token === 'string' ? data.headers.token : false;

    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        // Look up the user
        _data.read('users', phone, function (err, data) {
          if (!err && data) {
            _data.delete('users', phone, function (error) {
              if (error) {
                callback(200, { msg: 'Account deleted successfully' });
              } else {
                callback(500, { Error: 'The account could not be deleted' });
              }
            });
          } else {
            callback(400, { Error: 'Could not find the user' });
          }
        });
      } else {
        callback(403, { Error: 'Missing token in header or token invalid' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Tokens Handler
handlers.tokens = function (data, callback) {
  let acceptableMethods = ['post', 'put', 'get', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Tokens sub method container
handlers._tokens = {};

// Post sub method
// Required Data -> phone, password
// Optional Data -> none
handlers._tokens.post = function (data, callback) {
  const phone =
    typeof data.payload.phone === 'string' &&
    data.payload.phone.trim().length === 10
      ? data.payload.phone.trim()
      : false;
  const password =
    typeof data.payload.password === 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  if (phone && password) {
    _data.read('users', phone, function (err, userData) {
      if (!err && userData) {
        // Hash the password, and compare it to the password stored in the userData object
        let hashedPassword = helpers.hash(password);
        if (hashedPassword === userData.hashedPassword) {
          // Create a new token with a random name and expiration date 2 hrs in the future
          let tokenId = helpers.createRandomString(20);
          let expires = Date.now() + 1000 * 60 * 60 * 2;
          let tokenObject = {
            phone,
            expires,
            id: tokenId,
          };
          // Store the token
          _data.create('tokens', tokenId, tokenObject, function (error) {
            if (!error) {
              callback(200, tokenObject);
            } else {
              callback(500, { Error: "Token couldn't be created" });
            }
          });
        } else {
          callback(400, { Error: 'Invalid password' });
        }
      } else {
        callback(400, { Error: 'Could not find the specified data' });
      }
    });
  } else {
    callback(400, { Error: 'Required error field' });
  }
};

// Get sub method
// Required data : id
// Optional Data : none
handlers._tokens.get = function (data, callback) {
  // Check id is valid
  const id =
    typeof data.queryString.id === 'string' &&
    data.queryString.id.trim().length === 20
      ? data.queryString.id.trim()
      : false;

  if (id) {
    // Look up the user
    _data.read('tokens', id, function (err, data) {
      if (!err && data) {
        callback(200, data);
      } else {
        callback(404, { Error: "id doesn't exist" });
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Get Put method
// Required data : id,extend
// Optional data : none
handlers._tokens.put = function (data, callback) {
  const id =
    typeof data.payload.id === 'string' && data.payload.id.trim().length === 20
      ? data.payload.id.trim()
      : false;
  const extend =
    typeof data.payload.extend === 'boolean' ? data.payload.extend : false;
  if (id && extend) {
    if (data.expires > Date.now()) {
      _data.read('tokens', id, function (error, data) {
        if (!error) {
          let newExpiration = Date.now() + 1000 * 60 * 60 * 2;
          let newData = {
            ...data,
            expires: newExpiration,
          };
          _data.update('tokens', id, newData, function (error) {
            if (!error) {
              callback(200, newData);
            } else {
              callback(500, { Error: 'Could not update the token' });
            }
          });
        } else {
          callback(400, { Error: "The token doesn't exist" });
        }
      });
    } else {
      callback(400, { Error: 'The token has already expired' });
    }
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Delete the created token
// Required data : id
// Optional data : none
handlers._tokens.delete = function (data, callback) {
  // Check id is valid
  const id =
    typeof data.queryString.id === 'string' &&
    data.queryString.id.trim().length === 20
      ? data.queryString.id.trim()
      : false;

  if (id) {
    // Look up the user
    _data.read('tokens', id, function (err, data) {
      if (!err && data) {
        _data.delete('tokens', id, function (error) {
          if (error) {
            callback(200, { msg: 'Token deleted successfully' });
          } else {
            callback(500, { Error: 'The Token could not be deleted' });
          }
        });
      } else {
        callback(400, { Error: 'Could not find the token' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Ping handler
handlers.ping = function (data, callback) {
  callback(200);
};

// Verify that a given token id is valid for a given user
handlers._tokens.verifyToken = function (id, phone, callback) {
  _data.read('tokens', id, function (err, data) {
    if (!err) {
      if (data.phone === phone && data.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Not found handler
handlers.notFound = function (data, callback) {
  // Callback a http status code and a payload object
  callback(404);
};

module.exports = handlers;
