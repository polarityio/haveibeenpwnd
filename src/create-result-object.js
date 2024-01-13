const { getLogger } = require('./logger');

class PolarityResult {
  createEmptyBlock(entity) {
    return {
      entity: entity,
      data: {
        summary: [],
        details: []
      }
    };
  }

  createResultsObject(apiResponse) {
    return {
      entity: apiResponse.entity,
      data: {
        summary: createSummary(apiResponse),
        details: apiResponse.result.body
      }
    };
  }

  createNoResultsObject(entity) {
    return {
      entity,
      data: null
    };
  }

  retryablePolarityResponse = (entity) => {
    return {
      entity,
      isVolatile: true,
      data: {
        summary: ['Lookup limit reached'],
        details: {
          summaryTag: 'Lookup limit reached',
          errorMessage:
            'A temporary haveIbeenPwned API search limit was reached. You can retry your search by pressing the "Retry Search" button.'
        }
      }
    };
  };
}

function createSummary(apiResponse) {
  const tags = [];
  tags.push(`Breach Count: ${apiResponse.result.body.length}`);
  return tags;
}

module.exports = { PolarityResult };
