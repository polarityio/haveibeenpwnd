'use strict';
const { get } = require('lodash/fp');
const {
  logging: { setLogger, getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { buildIgnoreResults, organizeEntities } = require('./server/dataTransformations');

const { validateOptions } = require('./server/userOptions');
const searchEntities = require('./server/searchEntities');
const assembleLookupResults = require('./server/assembleLookupResults');

const doLookup = async (entities, options, cb) => {
  const Logger = getLogger();
  try {
    Logger.debug({ entities }, 'Entities');

    const { searchableEntities, nonSearchableEntities } = organizeEntities(entities);

    const { breachedEmails } = await searchEntities(searchableEntities, options);

    Logger.trace({ breachedEmails });

    const lookupResults = assembleLookupResults(entities, breachedEmails, options);

    const ignoreResults = buildIgnoreResults(nonSearchableEntities);

    Logger.trace({ lookupResults, ignoreResults }, 'Lookup Results');

    cb(null, lookupResults.concat(ignoreResults));
  } catch (error) {
    const err = parseErrorToReadableJson(error);

    Logger.error({ error, formattedError: err }, 'Get Lookup Results Failed');
    cb({ detail: error.message || 'Lookup Failed', err });
  }
};

function onMessage(payload, options, cb) {
  switch (payload.action) {
    case 'RETRY_LOOKUP':
      doLookup([payload.entity], options, (err, lookupResults) => {
        if (err) {
          getLogger().error({ err }, 'Error retrying lookup');
          cb(err);
        } else {
          cb(
            null,
            get('0.data', lookupResults) === null
              ? { data: { summary: ['No Results Found on Retry'] } }
              : lookupResults[0]
          );
        }
      });
      break;
  }
}

module.exports = {
  startup: setLogger,
  validateOptions,
  doLookup,
  onMessage
};
