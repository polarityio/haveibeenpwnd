const { flow, map } = require('lodash/fp');
const { requestsInParallel } = require('../request');

const searchEmailsForBreaches = async (entities, options) =>
  flow(
    map((entity) => ({
      entity,
      route: `/api/v3/breachedaccount/${entity.value}`,
      qs: {
        truncateResponse: false
      },
      headers: {
        'User-Agent': 'Polarity',
      },
      options
    })),
    async (searchEmailsForBreachesRequests) => await requestsInParallel(searchEmailsForBreachesRequests, 'body')
  )(entities);

module.exports = searchEmailsForBreaches;
