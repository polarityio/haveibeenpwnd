'use strict';

const _ = require('lodash');
const Bottleneck = require('bottleneck');
const config = require('./config/config');
const { setLogger, getLogger } = require('./src/logger');
const { parseErrorToReadableJSON } = require('./src/errors');
const { polarityRequest } = require('./src/polarity-request');
const { PolarityResult } = require('./src/create-result-object');
const { NetworkError, ApiRequestError, AuthRequestError, RetryRequestError } = require('./src/errors');

const RETRY_REQUEST = 429;
const SUCCESS = 200;
let retryCount = 0;

let limiter;

function startup(logger) {
  setLogger(logger);
}

/**
 * Sets up a Bottleneck limiter with the given options.
 * @param {Object} options - Configuration options for the limiter.
 */
function _setupLimiter(options) {
  limiter = new Bottleneck({
    maxConcurrent: 10, // No more than 10 concurrent requests
    highWater: 50, // No more than 50 lookups can be queued up
    strategy: Bottleneck.strategy.OVERFLOW,
    minTime: 10 // Minimum time between requests
  });
}

/**
 * Performs a lookup of entities using the polarityRequest API.
 * @param {Array} entities - The entities to look up.
 * @param {Object} options - Options for the request.
 * @param {Function} cb - Callback function.
 */
async function doLookup(entities, options, cb) {
  const Logger = getLogger();
  polarityRequest.setOptions(options);
  polarityRequest.setHeader('hibp-api-key', options.apiKey);
  polarityRequest.setHeader('User-Agent', 'Polarity');

  if (!limiter) _setupLimiter(options);

  try {
    const response = await limiter.schedule(_search, entities);

    const polarityResult = new PolarityResult();

    const lookupResults = response[0].map((apiResponse) => {
      const Logger = getLogger();
      if (_.size(apiResponse.result.body) && apiResponse.result.statusCode === SUCCESS) {
        return polarityResult.createResultsObject(apiResponse);
      }

      if (_.size(apiResponse.result.body) === 0) {
        return polarityResult.createNoResultsObject(apiResponse.entity);
      }

      if (apiResponse.result.statusCode === RETRY_REQUEST && retryCount < 3) {
        retryCount++;
        if (retryCount === 3) {
          Logger.trace({ retryCount }, 'Retry Count');
          throw new RetryRequestError('Retry limit reached');
        }
        Logger.trace({ apiResponse }, 'Retry RequestAAA');
        return polarityResult.retryablePolarityResponse(apiResponse);
      }
    });

    Logger.trace({ lookupResults }, 'Lookup Results');
    return cb(null, lookupResults);
  } catch (err) {
    const error = parseErrorToReadableJSON(err);
    return cb(error);
  }
}

async function _search(entities) {
  return await Promise.all(
    entities.map(async (entity) => {
      return polarityRequest.send({
        entity,
        method: 'GET',
        uri: `${polarityRequest.options.url}/api/v3/breachedaccount/${entity.value}?truncateResponse=false`
      });
    })
  );
}

function validateOptions(userOptions, cb) {
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

async function onMessage(payload, options, cb) {
  const Logger = getLogger();

  switch (payload.action) {
    case 'retry':
      doLookup([payload.entity], options, (err, lookupResults) => {
        if (err) {
          Logger.error({ err }, 'Error retrying lookup');
          cb(err);
        } else {
          Logger.trace({ lookupResults }, 'Retry Lookup Results_CCC');
          cb(
            null,
            lookupResults && lookupResults[0] && lookupResults[0].data === null
              ? { data: { summary: ['No Results Found on Retry'] } }
              : lookupResults[0]
          );
        }
      });
      break;
    default:
      Logger.debug({ payload }, 'Unknown message action received');
  }
}

module.exports = {
  doLookup: doLookup,
  onMessage: onMessage,
  validateOptions: validateOptions,
  startup: startup
};
