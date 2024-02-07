const { searchEmailsForBreaches } = require('./queries');

const searchEntities = async (entities, options) => {
  const breachedEmails = await searchEmailsForBreaches(entities, options);

  return { breachedEmails };
};

module.exports = searchEntities;
