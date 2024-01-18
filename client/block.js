'use strict';
polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  summary: Ember.computed.alias('block.data.summary'),
  emailBreaches: Ember.computed.alias('details.emailBreaches'),
  apiLimitErrorMessage: Ember.computed.alias('details.apiLimitErrorMessage'),
  retryFailedMessage: '',
  showCopyMessage: false,
  retryIsRunning: false,
  actions: {
    copyData: function (index) {
      Ember.run.scheduleOnce(
        'afterRender',
        this,
        this.copyElementToClipboard,
        `text-container-${index}`
      );
      Ember.run.scheduleOnce('destroy', this, this.restoreCopyState);
    },
    toggleScanner() {
      this.toggleProperty('isShowingDiv');
    },
    toggleVisibility() {
      this.toggleProperty('showEmail');
    },
    retryLookup: function () {
      this.set('retryIsRunning', true);
      const payload = {
        action: 'RETRY_LOOKUP',
        entity: this.get('block.entity')
      };
      this.sendIntegrationMessage(payload)
        .then((result) => {
          if (result.data.summary) this.set('summary', result.summary);
          this.set('block.data', result.data);
        })
        .catch((err) => {
          this.set('retryFailedMessage', JSON.stringify(err, null, 4));
        })
        .finally(() => {
          this.set('retryIsRunning', false);
          this.get('block').notifyPropertyChange('data');
        });
    }
  },
  copyElementToClipboard: function (element) {
    let range = document.createRange();

    window.getSelection().removeAllRanges();

    range.selectNode(
      typeof element === 'string' ? document.getElementById(element) : element
    );
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
  },
  getElementRange: function (element) {
    let range = document.createRange();
    range.selectNode(
      typeof element === 'string' ? document.getElementById(element) : element
    );
    return range;
  },
  restoreCopyState: function () {
    this.set('showCopyMessage', true);

    setTimeout(() => {
      if (!this.isDestroyed) {
        this.set('showCopyMessage', false);
      }
    }, 2000);
  }
});
