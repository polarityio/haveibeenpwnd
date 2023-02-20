'use strict';

let request = require('postman-request');
let _ = require('lodash');
let config = require('./config/config');
let async = require('async');
let fs = require('fs');
let Logger;
let requestDefault;

/**
 *
 * @param entities
 * @param options
 * @param cb
 */
function doLookup (entities, options, cb) {
  let lookupResults = [];
  let tasks = [];

  Logger.trace(entities);

  entities.forEach((entity) => {
    if (entity.value) {
      //do the lookup
      let requestOptions = {
        method: 'GET',
        uri: options.url + '/api/v3/breachedaccount/' + entity.value + '?truncateResponse=false',
        headers: {
          'User-Agent': 'Polarity',
          'hibp-api-key': options.apiKey
        },
        json: true
      };

      Logger.trace({ uri: requestOptions }, 'Request URI');

      tasks.push(function (done) {
        requestDefault(requestOptions, function (error, res, body) {
          if (error) {
            done({
              error: error,
              entity: entity.value,
              detail: 'Error in Request'
            });
            return;
          }

          let result = {};
          if (res.statusCode === 200) {
            result = {
              entity: entity,
              body: body
            };
          } else if (res.statusCode === 429) {
            // reached rate limit
            error = 'Rate limit is exceeded. Try again in 2 seconds';
          } else if (res.statusCode === 404) {
            // reached rate limit
            result = {
              entity: entity,
              body: null
            };
          } else {
            // Non 200 status code
            done({
              error: error,
              httpStatus: res.statusCode,
              body: body,
              detail: 'Unexpected Non 200 HTTP Status Code',
              entity: entity.value
            });
            return;
          }
          done(error, result);
        });
      });
    }
  });

  async.parallelLimit(tasks, 10, (err, results) => {
    if (err) {
      cb(err);
      return;
    }

    results.forEach((result) => {
      Logger.trace({ result: result }, 'Results of the Lookip');
      if (result.body === null || _isMiss(result.body)) {
        lookupResults.push({
          entity: result.entity,
          data: null
        });
      } else {
        lookupResults.push({
          entity: result.entity,
          data: {
            summary: [],
            details: result.body
          }
        });
      }
    });

    Logger.trace({ lookupResults: lookupResults }, 'Lookup Results');

    cb(null, lookupResults);
  });
}

function _isMiss (body) {
  if (body && Array.isArray(body) && body.length === 0) {
    return true;
  }
  return false;
}

function startup (logger) {
  Logger = logger;

  let defaults = {};

  if (typeof config.request.cert === 'string' && config.request.cert.length > 0) {
    defaults.cert = fs.readFileSync(config.request.cert);
  }

  if (typeof config.request.key === 'string' && config.request.key.length > 0) {
    defaults.key = fs.readFileSync(config.request.key);
  }

  if (typeof config.request.passphrase === 'string' && config.request.passphrase.length > 0) {
    defaults.passphrase = config.request.passphrase;
  }

  if (typeof config.request.ca === 'string' && config.request.ca.length > 0) {
    defaults.ca = fs.readFileSync(config.request.ca);
  }

  if (typeof config.request.proxy === 'string' && config.request.proxy.length > 0) {
    defaults.proxy = config.request.proxy;
  }

  requestDefault = request.defaults(defaults);
}

function validateOptions (userOptions, cb) {
  let errors = [];
  if (
    typeof userOptions.apiKey.value !== 'string' ||
    (typeof userOptions.apiKey.value === 'string' && userOptions.apiKey.value.length === 0)
  ) {
    errors.push({
      key: 'apiKey',
      message: 'You must provide a valid API key'
    });
  }
  cb(null, errors);
}

module.exports = {
  doLookup: doLookup,
  validateOptions: validateOptions,
  startup: startup
};
