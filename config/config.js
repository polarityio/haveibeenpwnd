module.exports = {
  /**
   * Name of the integration which is displayed in the Polarity integrations user interface
   *
   * @type String
   * @required
   */
  name: 'have i been pwned?',
  /**
   * The acronym that appears in the notification window when information from this integration
   * is displayed.  Note that the acronym is included as part of each "tag" in the summary information
   * for the integration.  As a result, it is best to keep it to 4 or less characters.  The casing used
   * here will be carried forward into the notification window.
   *
   * @type String
   * @required
   */
  acronym: 'PWND',
  /**
   * Description for this integration which is displayed in the Polarity integrations user interface
   *
   * @type String
   * @optional
   */
  description:
    "Queries emails in have i been pwnd's dataset to determine whether or not an email has been involved in breaches",
  entityTypes: ['email'],
  /**
   * An array of style files (css or less) that will be included for your integration. Any styles specified in
   * the below files can be used in your custom template.
   *
   * @type Array
   * @optional
   */
  styles: ['./styles/pwnd.less'],
  defaultColor: 'light-blue',
  /**
   * Provide custom component logic and template for rendering the integration details block.  If you do not
   * provide a custom template and/or component then the integration will display data as a table of key value
   * pairs.
   *
   * @type Object
   * @optional
   */
  block: {
    component: {
      file: './components/pwnd-block.js'
    },
    template: {
      file: './templates/pwnd-block.hbs'
    }
  },
  request: {
    // Provide the path to your certFile. Leave an empty string to ignore this option.
    // Relative paths are relative to the HA integration's root directory
    cert: '',
    // Provide the path to your private key. Leave an empty string to ignore this option.
    // Relative paths are relative to the HA integration's root directory
    key: '',
    // Provide the key passphrase if required.  Leave an empty string to ignore this option.
    // Relative paths are relative to the HA integration's root directory
    passphrase: '',
    // Provide the Certificate Authority. Leave an empty string to ignore this option.
    // Relative paths are relative to the HA integration's root directory
    ca: '',
    // An HTTP proxy to be used. Supports proxy Auth with Basic Auth, identical to support for
    // the url parameter (by embedding the auth info in the uri)
    proxy: ''
  },
  logging: {
    level: 'trace' //trace, debug, info, warn, error, fatal
  },
  /**
   * Options that are displayed to the user/admin in the Polarity integration user-interface.  Should be structured
   * as an array of option objects.
   *
   * @type Array
   * @optional
   */
  options: [
    {
      key: 'url',
      name: 'have i been pwned? URL',
      description: 'Base URL for have i been pwned? including the schema (i.e., https://)',
      default: 'https://haveibeenpwned.com',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'apiKey',
      name: 'API Key',
      description: 'have i been pwned? API Key',
      default: '',
      type: 'password',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'maxConcurrent',
      name: 'Max Concurrent Search Requests',
      description:
        'Maximum number of concurrent search requests (defaults to 10).  Integration must be restarted after changing this option.',
      default: 10,
      type: 'number',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'minTime',
      name: 'Minimum Time Between Searches',
      description:
        'Minimum amount of time in milliseconds between each entity search (defaults to 25).  Integration must be restarted after changing this option.',
      default: 25,
      type: 'number',
      userCanEdit: false,
      adminOnly: true
    }
  ]
};
