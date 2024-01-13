'use strict';
polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  showCopyMessage: false,
  actions: {
    copyData: function (index) {
      Ember.run.scheduleOnce('afterRender', this, this.copyElementToClipboard, `text-container-${index}`);
      Ember.run.scheduleOnce('destroy', this, this.restoreCopyState);
    },
    toggleScanner() {
      this.toggleProperty('isShowingDiv');
    },
    toggleVisibility() {
      this.toggleProperty('showEmail');
    },
    retryLookup: function () {
      this.set('running', true);
      this.set('errorMessage', '');

      const payload = {
        action: 'retry',
        entity: this.get('block.entity')
      };

      this.sendIntegrationMessage(payload)
        .then((result) => {
          if (result.data.summary) this.set('summary', result.summary);
          this.set('block.data', result.data);
        })
        .catch((err) => {
          this.set('details.errorMessage', JSON.stringify(err, null, 4));
        })
        .finally(() => {
          this.set('running', false);
        });
    }
  },
  copyElementToClipboard: function (element) {
    let range = document.createRange();

    window.getSelection().removeAllRanges();

    range.selectNode(typeof element === 'string' ? document.getElementById(element) : element);
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
  },
  getElementRange: function (element) {
    let range = document.createRange();
    range.selectNode(typeof element === 'string' ? document.getElementById(element) : element);
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
