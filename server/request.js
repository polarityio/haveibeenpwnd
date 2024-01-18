const {
  requests: { createRequestWithDefaults },
  logging: { getLogger }
} = require('polarity-integration-utils');

const { parallelLimit } = require('async');
const { map, get, getOr, filter, flow, negate, isEmpty } = require('lodash/fp');

const requestWithDefaults = createRequestWithDefaults({
  config: require('../config/config'),
  roundedSuccessStatusCodes: [200],
  useLimiter: true,
  requestOptionsToOmitFromLogsKeyPaths: ['hibp-api-key'],
  preprocessRequestOptions: ({ options, route, ...requestOptions }) => {
    return {
      ...requestOptions,
      options,
      url: `${options.url}${route}`,
      headers: {
        ...requestOptions.headers,
        'hibp-api-key': options.apiKey
      },
      json: true
    };
  },
  postprocessRequestFailure: (error) => {
    if (error.status === 404) return;
    if (error.status === 429) {
      const responseBody = JSON.parse(error.description);
      return {
        body: {
          apiLimitErrorMessage:
            get('message', responseBody) ||
            responseBody ||
            'Rate limit is exceeded. Try again in 5-10 seconds'
        }
      };
    }

    throw error;
  }
});

const createRequestsInParallel =
  (requestWithDefaults) =>
  async (
    requestsOptions,
    responseGetPath,
    limit = 10,
    onlyReturnPopulatedResults = true
  ) => {
    const unexecutedRequestFunctions = map(
      ({ entity, ...requestOptions }) =>
        async () => {
          const response = await requestWithDefaults(requestOptions);
          const result = responseGetPath ? get(responseGetPath, response) : response;
          return entity ? { entity, result } : result;
        },
      requestsOptions
    );

    const results = await parallelLimit(unexecutedRequestFunctions, limit);

    return onlyReturnPopulatedResults
      ? filter(
          flow((result) => getOr(result, 'result', result), negate(isEmpty)),
          results
        )
      : results;
  };

const requestsInParallel = createRequestsInParallel(requestWithDefaults);

module.exports = {
  requestWithDefaults,
  requestsInParallel
};
