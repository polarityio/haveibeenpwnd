const { flow, get, size, find, eq, map, some, orderBy } = require('lodash/fp');

const assembleLookupResults = (entities, breachedEmails, options) =>
  flow(
    map((entity) => {
      const resultsForThisEntity = getResultsForThisEntity(
        entity,
        breachedEmails,
        options
      );

      const resultsFound = some(
        (resultField) => size(resultField) || resultField === true,
        resultsForThisEntity
      );

      const apiLimitErrorMessage = get('apiLimitErrorMessage', resultsForThisEntity);
      const lookupResult = {
        entity,
        isVolatile: !!apiLimitErrorMessage,
        data: !resultsFound
          ? null
          : apiLimitErrorMessage
          ? {
              summary: ['Search Limit Reached'],
              details: {
                apiLimitErrorMessage
              }
            }
          : {
              summary: createSummaryTags(resultsForThisEntity, options),
              details: resultsForThisEntity
            }
      };

      return lookupResult;
    }),
    orderBy(
      (lookupResult) =>
        get('data.summary.0', lookupResult) === 'Search Limit Reached' ? 0 : 1,
      'asc'
    )
  )(entities);

const getResultForThisEntity = (entity, results) =>
  flow(find(flow(get('entity.value'), eq(entity.value))), get('result'))(results);

const getResultsForThisEntity = (entity, breachedEmails, options) => {
  const resultsForThisEntity = getResultForThisEntity(entity, breachedEmails);
  const apiLimitErrorMessage = get('apiLimitErrorMessage', resultsForThisEntity);

  return apiLimitErrorMessage
    ? { apiLimitErrorMessage }
    : {
        emailBreaches: getResultForThisEntity(entity, breachedEmails)
      };
};
const createSummaryTags = ({ emailBreaches }, options) =>
  [].concat(
    size(emailBreaches) && !emailBreaches.apiLimitErrorMessage
      ? `Breach Count: ${size(emailBreaches)}`
      : []
  );

module.exports = assembleLookupResults;
