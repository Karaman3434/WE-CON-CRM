/* WE-CON-CRM Activity Repository
 * Storage boundary for Son Hareket records.
 */
(function (global) {
  'use strict';

  const repository = {
    adapter: null,

    configure(adapter) {
      if (!adapter || typeof adapter.list !== 'function' || typeof adapter.save !== 'function') {
        throw new TypeError('Activity adapter must implement list() and save().');
      }
      this.adapter = adapter;
      return this;
    },

    async listByCustomer(customerId) {
      if (!this.adapter) throw new Error('Activity repository is not configured.');
      if (!customerId) return [];
      return this.adapter.list(String(customerId));
    },

    async save(activity) {
      if (!this.adapter) throw new Error('Activity repository is not configured.');
      if (!activity || typeof activity !== 'object') {
        throw new TypeError('Activity must be an object.');
      }
      return this.adapter.save(activity);
    }
  };

  global.WEICONActivityRepository = repository;
})(window);
