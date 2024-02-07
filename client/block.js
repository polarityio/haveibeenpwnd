'use strict';
polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  summary: Ember.computed.alias('block.data.summary'),
  emailBreaches: Ember.computed.alias('details.emailBreaches'),
  apiLimitErrorMessage: Ember.computed.alias('details.apiLimitErrorMessage'),
  retryFailedMessage: '',
  showCopyMessage: false,
  retryIsRunning: false,
  pagedEmailBreaches: Ember.computed(
    'block._state.paging.from',
    'emailBreaches',
    function () {
      const from = +this.get('block._state.paging.from');
      const size = this.get('block._state.paging.size');
      return this.get('emailBreaches').slice(from, from + size);
    }
  ),
  init() {
    this._super(...arguments);

    if (!this.get('block._state')) {
      this.set('block._state', {});
      this.set('block._state.paging', {
        size: 10,
        from: 0
      });
      this.updatePageParameters();
    }
  },
  actions: {
    copyData: function (index) {
      Ember.run.scheduleOnce(
        'afterRender',
        this,
        this.copyElementToClipboard,
        `text-container-${index}`
      );
      Ember.run.scheduleOnce('destroy', this, this.restoreCopyState, index);
    },
    setPage(fromIndex) {
      this.set('block._state.paging.from', fromIndex);
      this.updatePageParameters();
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
          this.updatePageParameters();
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
  updatePageParameters() {
    let from = +this.get('block._state.paging.from');
    let size = this.get('block._state.paging.size');
    let totalResults = this.get('emailBreaches.length');

    if (totalResults <= size) {
      this.set('block._state.paging.allResultsReturned', true);
    }

    this.set('block._state.paging.startItem', from + 1);
    this.set(
      'block._state.paging.endItem',
      from + size + 1 > totalResults ? totalResults : from + size
    );

    const finalPagingIndex =
      totalResults % size === 0
        ? totalResults - size
        : totalResults - (totalResults % size);
    const nextPageIndex =
      from + size >= totalResults - 1 ? finalPagingIndex : from + size;
    const prevPageIndex = from - size < 0 ? 0 : from - size;
    const firstPageIndex = 0;
    const lastPageIndex = size < totalResults ? finalPagingIndex : 0;

    this.set('block._state.paging.nextPageIndex', nextPageIndex);
    this.set('block._state.paging.prevPageIndex', prevPageIndex);
    this.set('block._state.paging.firstPageIndex', firstPageIndex);
    this.set('block._state.paging.lastPageIndex', lastPageIndex);

    // There are no more pages to show so we can disable the next buttons
    if (this.get('block._state.paging.endItem') === totalResults) {
      this.set('block._state.paging.disableNextButtons', true);
    } else {
      this.set('block._state.paging.disableNextButtons', false);
    }

    // There are no more pages to show so we can disable the prev buttons
    if (this.get('block._state.paging.startItem') === 1) {
      this.set('block._state.paging.disablePrevButtons', true);
    } else {
      this.set('block._state.paging.disablePrevButtons', false);
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
  restoreCopyState: function (index) {
    this.set(`pagedEmailBreaches.${index}._showCopyMessage`, true);

    setTimeout(() => {
      if (!this.isDestroyed) {
        this.set(`pagedEmailBreaches.${index}._showCopyMessage`, false);
      }
    }, 2000);
  }
});
