const { validateStringOptions, validateUrlOption } = require('./utils');

const validateOptions = async (options, callback) => {
  const stringOptionsErrorMessages = {
    url: '* Required',
    apiKey: '* Required'
  };

  const stringValidationErrors = validateStringOptions(
    stringOptionsErrorMessages,
    options
  );

  const urlValidationError = validateUrlOption(options);

  const maxConcurrentError =
    options.maxConcurrent.value < 1
      ? {
          key: 'maxConcurrent',
          message: 'Max Concurrent Requests must be 1 or higher'
        }
      : [];

  const minTimeError =
    options.minTime.value < 1
      ? {
          key: 'maxConcurrent',
          message: 'Minimum Time Between Lookups must be 1 or higher'
        }
      : [];

  const errors = stringValidationErrors
    .concat(urlValidationError)
    .concat(maxConcurrentError)
    .concat(minTimeError);

  callback(null, errors);
};

module.exports = validateOptions;
