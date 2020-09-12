/*
 * Library for storing and editing the data
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// Container for the module (to be exported)
let lib = {};

// Define the base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// lib.create

lib.create = function (dir, file, data, callback) {
  // Open the file for writing
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function (
    error,
    fileDescriptor
  ) {
    if (!error && fileDescriptor) {
      // Convert data to string
      let stringData = JSON.stringify(data);

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringData, function (err) {
        if (!err) {
          fs.close(fileDescriptor, function (error) {
            if (!err) {
              callback(false);
            } else {
              callback('Error closing new file');
            }
          });
        } else {
          callback('error writing to new file');
        }
      });
    } else {
      callback("Couldn't create new file , it may already exist");
    }
  });
};

// Read data from a file
lib.read = function (dir, file, callback) {
  fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf-8', function (
    error,
    data
  ) {
    if (!error && data) {
      let parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
    } else {
      callback(error, data);
    }
  });
};

// Update the data of a file
lib.update = function (dir, file, data, callback) {
  // Open the file for writing
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function (
    error,
    fileDescriptor
  ) {
    if (!error) {
      let stringData = JSON.stringify(data);

      // truncate the contents of the file
      fs.ftruncate(fileDescriptor, (err) => {
        if (!err) {
          // Write to the file and close it
          fs.writeFile(fileDescriptor, stringData, function (err) {
            if (!err) {
              fs.close(fileDescriptor, function (err) {
                if (!err) {
                  callback(false);
                } else {
                  callback('Error closing the file ');
                }
              });
            } else {
              callback('There was a problem writing to existing file');
            }
          });
        } else {
          callback('Error truncating the contents of the file');
        }
      });
    } else {
      callback('Could not open the file for updating. It may not exist yet');
    }
  });
};

// Deleting a file
lib.delete = function (dir, file, callback) {
  // Unlink the file from the filesystem
  fs.unlink(lib.baseDir + dir + '/' + file + '.json', function (err) {
    if (!err) {
      callback(false);
    } else {
      callback('Error deleteing the file');
    }
  });
};

// Export the modules
module.exports = lib;
