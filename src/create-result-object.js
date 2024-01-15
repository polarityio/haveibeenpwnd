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

  retryablePolarityResponse = (apiResponse) => {
    return {
      entity: apiResponse.entity,
      data: {
        summary: ['Lookup limit reached'],
        details: {
          allowRetry: true,
          summaryTag: 'Lookup limit reached',
          errorMessage: `${apiResponse.result.body.message}`
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
