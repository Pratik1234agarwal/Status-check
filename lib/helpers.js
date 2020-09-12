/*
 * Helpers for different functions
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');

// Container for different helpers
let helpers = {};

// Create a SHA256 hash
helpers.hash = function (password) {
  if (typeof password === 'string' && password.length > 0) {
    let hash = crypto
      .createHmac('sha256', config.hashingSecret)
      .update(password)
      .digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function (str) {
  try {
    let obj = JSON.parse(str);
    return obj;
  } catch (err) {
    return {};
  }
};

// Create a string of random alpha-numeric length
helpers.createRandomString = function (len) {
  len = typeof len === 'number' && len > 0 ? len : false;
  if (len) {
    let possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Start the final string
    let str = '';
    for (let i = 0; i < len; i++) {
      // Get a random character from the possibleCharacters string
      let randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );
      // Append this character to the final string
      str = str + randomCharacter;
    }

    return str;
  } else {
    return false;
  }
};

module.exports = helpers;
