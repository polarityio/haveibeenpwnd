'use strict'
polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),

  actions: {
      toggleScanner() {
            this.toggleProperty('isShowingDiv');
        },
      toggleVisibility() {
      this.toggleProperty('showEmail');
    }
    }
});
